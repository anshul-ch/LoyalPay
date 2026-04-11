using LoyalPay.AdminService.Data;
using LoyalPay.AdminService.DTOs;
using LoyalPay.AdminService.Models;
using LoyalPay.Shared.Common;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.AdminService.Services;

public class AdminService
{
    private readonly AdminAuthDbContext _authDb;
    private readonly AdminWalletDbContext _walletDb;
    private readonly AdminRewardsDbContext _rewardsDb;

    public AdminService(AdminAuthDbContext authDb, AdminWalletDbContext walletDb, AdminRewardsDbContext rewardsDb)
    {
        _authDb = authDb;
        _walletDb = walletDb;
        _rewardsDb = rewardsDb;
    }

    public async Task<ApiResponse<List<UserView>>> GetPendingKycAsync()
    {
        var users = await _authDb.Users
            .Where(u => u.KycStatus == "Pending" && u.KycFilePath != null)
            .ToListAsync();

        return ApiResponse<List<UserView>>.Ok(users);
    }

    public async Task<ApiResponse<string>> ReviewKycAsync(Guid userId, KycReviewDto dto, Guid adminUserId)
    {
        if (dto.Decision != "Approved" && dto.Decision != "Rejected")
        {
            return ApiResponse<string>.Fail("Decision must be Approved or Rejected.");
        }

        var user = await _authDb.Users.FindAsync(userId);
        if (user == null)
        {
            return ApiResponse<string>.Fail("User not found.");
        }

        user.KycStatus = dto.Decision;
        user.KycReviewedAt = DateTime.UtcNow;
        if (dto.Decision == "Rejected")
        {
            user.KycRejectionNote = dto.RejectionNote;
        }
        else
        {
            user.KycRejectionNote = null;
        }

        await _authDb.SaveChangesAsync();

        var log = new AuditLog();
        log.AdminUserId = adminUserId;
        log.Action = "KYC_" + dto.Decision.ToUpper();
        log.Notes = "UserId: " + userId;
        _rewardsDb.AuditLogs.Add(log);
        await _rewardsDb.SaveChangesAsync();

        return ApiResponse<string>.Ok("KYC " + dto.Decision + ".");
    }

    public async Task<ApiResponse<Campaign>> CreateCampaignAsync(CampaignDto dto, Guid adminUserId)
    {
        if (dto.StartDate >= dto.EndDate)
        {
            return ApiResponse<Campaign>.Fail("End date must be after start date.");
        }

        var campaign = new Campaign();
        campaign.Name = dto.Name;
        campaign.Description = dto.Description;
        campaign.BonusPoints = dto.BonusPoints;
        campaign.StartDate = dto.StartDate;
        campaign.EndDate = dto.EndDate;
        campaign.IsActive = true;

        _rewardsDb.Campaigns.Add(campaign);

        var log = new AuditLog();
        log.AdminUserId = adminUserId;
        log.Action = "CAMPAIGN_CREATED";
        log.Notes = dto.Name;
        _rewardsDb.AuditLogs.Add(log);

        await _rewardsDb.SaveChangesAsync();
        return ApiResponse<Campaign>.Ok(campaign);
    }

    public async Task<ApiResponse<object>> GetDashboardAsync()
    {
        var totalUsers = await _authDb.Users.CountAsync(u => u.Role == "User");
        var pendingKyc = await _authDb.Users.CountAsync(u => u.KycStatus == "Pending");
        var totalBalance = await _walletDb.WalletAccounts.SumAsync(w => (decimal?)w.Balance) ?? 0;
        var silver = await _rewardsDb.RewardAccounts.CountAsync(r => r.Tier == "Silver");
        var gold = await _rewardsDb.RewardAccounts.CountAsync(r => r.Tier == "Gold");
        var platinum = await _rewardsDb.RewardAccounts.CountAsync(r => r.Tier == "Platinum");

        var data = new
        {
            TotalUsers = totalUsers,
            PendingKycCount = pendingKyc,
            TotalWalletBalance = totalBalance,
            SilverCount = silver,
            GoldCount = gold,
            PlatinumCount = platinum
        };

        return ApiResponse<object>.Ok(data);
    }

    public async Task<ApiResponse<List<object>>> GetUsersAsync()
    {
        var users = await _authDb.Users.Where(u => u.Role == "User").ToListAsync();
        var wallets = await _walletDb.WalletAccounts.ToListAsync();
        var rewards = await _rewardsDb.RewardAccounts.ToListAsync();

        var result = users.Select(u => (object)new
        {
            u.UserId,
            u.FullName,
            u.Email,
            u.KycStatus,
            u.IsActive,
            Balance = wallets.FirstOrDefault(w => w.UserId == u.UserId)?.Balance ?? 0,
            Points = rewards.FirstOrDefault(r => r.UserId == u.UserId)?.TotalPoints ?? 0,
            Tier = rewards.FirstOrDefault(r => r.UserId == u.UserId)?.Tier ?? "Silver"
        }).ToList();

        return ApiResponse<List<object>>.Ok(result);
    }
}
