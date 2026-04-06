using LoyalPay.AdminService.Application.DTOs;
using LoyalPay.AdminService.Application.Interfaces;
using LoyalPay.AdminService.Domain.Entities;
using LoyalPay.AdminService.Infrastructure.Persistence.DbContext;
using LoyalPay.Shared.Common;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.AdminService.Application.Services;

public class AdminService : IAdminService
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

    public async Task<ApiResponse<List<object>>> GetPendingKycAsync()
    {
        // Admin reads from a join to only show users that still have pending submission records.

        var kycRows = await _authDb.Database
            .SqlQueryRaw<KycPendingRow>(@"
                SELECT DISTINCT u.UserId, u.Email, u.Phone, u.FullName, u.KycStatus,
                       u.KycDocumentType, u.KycDocumentNumber, u.KycFilePath, u.CreatedAt
                FROM Users u
                INNER JOIN KycSubmissions k ON k.UserId = u.UserId
                WHERE k.Status = 'Pending'
            ")
            .ToListAsync();

        var data = kycRows.Select(x => (object)new
        {
            x.UserId,
            x.FullName,
            x.Email,
            x.Phone,
            x.KycStatus,
            x.KycDocumentType,
            x.KycDocumentNumber,
            x.KycFilePath,
            x.CreatedAt
        }).ToList();

        return ApiResponse<List<object>>.Ok(data);
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

        // Keep an immutable admin trail in Rewards DB for cross-service admin actions.

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
        var silver = await _rewardsDb.RewardAccounts.CountAsync(r => r.Tier == "Silver");
        var gold = await _rewardsDb.RewardAccounts.CountAsync(r => r.Tier == "Gold");
        var platinum = await _rewardsDb.RewardAccounts.CountAsync(r => r.Tier == "Platinum");

        var data = new
        {
            TotalUsers = totalUsers,
            PendingKycCount = pendingKyc,
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
            Points = rewards.FirstOrDefault(r => r.UserId == u.UserId)?.TotalPoints ?? 0,
            Tier = rewards.FirstOrDefault(r => r.UserId == u.UserId)?.Tier ?? "Silver"
        }).ToList();

        return ApiResponse<List<object>>.Ok(result);
    }
}

public class KycPendingRow
{
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string KycStatus { get; set; } = string.Empty;
    public string? KycDocumentType { get; set; }
    public string? KycDocumentNumber { get; set; }
    public string? KycFilePath { get; set; }
    public DateTime CreatedAt { get; set; }
}
