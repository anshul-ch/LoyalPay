using LoyalPay.AdminService.Application.DTOs;
using LoyalPay.AdminService.Application.Interfaces;
using LoyalPay.AdminService.Domain.Entities;
using LoyalPay.AdminService.Infrastructure.Persistence.DbContext;
using LoyalPay.Shared.Common;
using LoyalPay.Shared.Entities;
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

    public async Task<ApiResponse<object>> GetDashboardAsync()
    {
        var totalUsers  = await _authDb.Users.CountAsync(u => u.Role == "User");
        var pendingKyc  = await _authDb.Users.CountAsync(u => u.KycStatus == "Pending");
        var silver      = await _rewardsDb.RewardAccounts.CountAsync(r => r.Tier == "Silver");
        var gold        = await _rewardsDb.RewardAccounts.CountAsync(r => r.Tier == "Gold");
        var platinum    = await _rewardsDb.RewardAccounts.CountAsync(r => r.Tier == "Platinum");

        var data = new
        {
            TotalUsers      = totalUsers,
            PendingKycCount = pendingKyc,
            SilverCount     = silver,
            GoldCount       = gold,
            PlatinumCount   = platinum
        };

        return ApiResponse<object>.Ok(data);
    }

    public async Task<ApiResponse<List<object>>> GetUsersAsync()
    {
        // NOTE: Loads all users, wallets, and rewards into memory and joins in-process.
        // Fine for small datasets; add server-side pagination if user count grows large.
        var users   = await _authDb.Users.Where(u => u.Role == "User").ToListAsync();
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
            Points  = rewards.FirstOrDefault(r => r.UserId == u.UserId)?.TotalPoints ?? 0,
            Tier    = rewards.FirstOrDefault(r => r.UserId == u.UserId)?.Tier ?? "Silver"
        }).ToList();

        return ApiResponse<List<object>>.Ok(result);
    }

    public async Task<ApiResponse<List<object>>> GetPendingKycAsync()
    {
        // Join Users with their latest pending KYC submission for full context.
        var pendingSubmissions = await _authDb.KycSubmissions
            .Where(k => k.Status == "Pending")
            .OrderByDescending(k => k.SubmittedAt)
            .ToListAsync();

        var userIds = pendingSubmissions.Select(k => k.UserId).Distinct().ToList();
        var users   = await _authDb.Users
            .Where(u => userIds.Contains(u.UserId))
            .ToListAsync();

        var data = pendingSubmissions.Select(k =>
        {
            var user = users.FirstOrDefault(u => u.UserId == k.UserId);
            return (object)new
            {
                k.SubmissionId,
                k.UserId,
                FullName       = user?.FullName ?? "",
                Email          = user?.Email ?? "",
                k.DocumentType,
                k.DocumentNumber,
                k.FileName,
                k.Status,
                k.SubmittedAt
            };
        }).ToList();

        return ApiResponse<List<object>>.Ok(data);
    }

    public async Task<ApiResponse<List<object>>> GetKycSubmissionsByUserAsync(Guid userId)
    {
        var submissions = await _authDb.KycSubmissions
            .Where(k => k.UserId == userId)
            .OrderByDescending(k => k.SubmittedAt)
            .ToListAsync();

        var data = submissions.Select(k => (object)new
        {
            k.SubmissionId,
            k.UserId,
            k.DocumentType,
            k.DocumentNumber,
            k.FileName,
            k.Status,
            k.RejectionNote,
            k.SubmittedAt,
            k.ReviewedAt
        }).ToList();

        return ApiResponse<List<object>>.Ok(data);
    }

    public async Task<(byte[] Data, string ContentType, string FileName)?> GetKycDocumentAsync(Guid submissionId)
    {
        var submission = await _authDb.KycSubmissions.FindAsync(submissionId);
        if (submission == null || submission.FileData.Length == 0)
        {
            return null;
        }

        return (submission.FileData, submission.ContentType, submission.FileName);
    }

    public async Task<ApiResponse<string>> ReviewKycAsync(Guid submissionId, KycReviewDto dto, Guid adminUserId)
    {
        if (dto.Decision != "Approved" && dto.Decision != "Rejected")
        {
            return ApiResponse<string>.Fail("Decision must be Approved or Rejected.");
        }

        var submission = await _authDb.KycSubmissions.FindAsync(submissionId);
        if (submission == null)
        {
            return ApiResponse<string>.Fail("KYC submission not found.");
        }

        // Update the submission record.
        submission.Status       = dto.Decision;
        submission.ReviewedAt   = DateTime.UtcNow;
        submission.RejectionNote = dto.Decision == "Rejected" ? dto.RejectionNote : null;

        // Mirror the decision onto the User row for quick status checks.
        var user = await _authDb.Users.FindAsync(submission.UserId);
        if (user != null)
        {
            user.KycStatus       = dto.Decision;
            user.KycReviewedAt   = DateTime.UtcNow;
            user.KycRejectionNote = submission.RejectionNote;
        }

        await _authDb.SaveChangesAsync();

        // Write an immutable audit trail in the Rewards DB.
        var log = new AuditLog
        {
            AdminUserId = adminUserId,
            Action      = "KYC_" + dto.Decision.ToUpper(),
            Notes       = $"SubmissionId: {submissionId}, UserId: {submission.UserId}"
        };
        _rewardsDb.AuditLogs.Add(log);
        await _rewardsDb.SaveChangesAsync();

        return ApiResponse<string>.Ok($"KYC {dto.Decision}.");
    }

    public async Task<ApiResponse<Campaign>> CreateCampaignAsync(CampaignDto dto, Guid adminUserId)
    {
        if (dto.StartDate >= dto.EndDate)
        {
            return ApiResponse<Campaign>.Fail("End date must be after start date.");
        }

        var campaign = new Campaign
        {
            Name        = dto.Name,
            Description = dto.Description,
            BonusPoints = dto.BonusPoints,
            StartDate   = dto.StartDate,
            EndDate     = dto.EndDate,
            IsActive    = true
        };

        _rewardsDb.Campaigns.Add(campaign);

        var log = new AuditLog
        {
            AdminUserId = adminUserId,
            Action      = "CAMPAIGN_CREATED",
            Notes       = dto.Name
        };
        _rewardsDb.AuditLogs.Add(log);

        await _rewardsDb.SaveChangesAsync();
        return ApiResponse<Campaign>.Ok(campaign);
    }
}
