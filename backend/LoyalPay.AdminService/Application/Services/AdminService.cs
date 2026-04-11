using LoyalPay.AdminService.Application.DTOs;
using LoyalPay.AdminService.Application.Interfaces;
using LoyalPay.AdminService.Domain.Entities;
using LoyalPay.AdminService.Infrastructure.Persistence.DbContext;
using LoyalPay.Shared.Common;
using LoyalPay.Shared.Entities;
using LoyalPay.Shared.Events;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.AdminService.Application.Services;

public class AdminService : IAdminService
{
    private readonly AdminAuthDbContext _authDb;
    private readonly AdminWalletDbContext _walletDb;
    private readonly AdminRewardsDbContext _rewardsDb;
    private readonly IPublishEndpoint _publishEndpoint;

    public AdminService(
        AdminAuthDbContext authDb,
        AdminWalletDbContext walletDb,
        AdminRewardsDbContext rewardsDb,
        IPublishEndpoint publishEndpoint)
    {
        _authDb = authDb;
        _walletDb = walletDb;
        _rewardsDb = rewardsDb;
        _publishEndpoint = publishEndpoint;
    }

    private static int GetRewardExpiryMonths(int pointsCost)
    {
        if (pointsCost <= 300) return 1;
        if (pointsCost <= 1000) return 2;
        if (pointsCost <= 3000) return 3;
        return 4;
    }

    public async Task<ApiResponse<object>> GetDashboardAsync()
    {
        var totalUsers  = await _authDb.Users.CountAsync(u => u.Role == "User");
        var pendingKyc  = await _authDb.KycSubmissions.CountAsync(k => k.Status == "Pending");
        var totalWalletsBalance = await _walletDb.WalletAccounts.SumAsync(w => (decimal?)w.Balance) ?? 0m;
        var silver      = await _rewardsDb.RewardAccounts.CountAsync(r => r.Tier == "Silver");
        var gold        = await _rewardsDb.RewardAccounts.CountAsync(r => r.Tier == "Gold");
        var platinum    = await _rewardsDb.RewardAccounts.CountAsync(r => r.Tier == "Platinum");

        var data = new
        {
            TotalUsers      = totalUsers,
            TotalWalletsBalance = totalWalletsBalance,
            PendingKycCount = pendingKyc,
            SilverCount     = silver,
            GoldCount       = gold,
            PlatinumCount   = platinum
        };

        return ApiResponse<object>.Ok(data);
    }

    public async Task<ApiResponse<object>> GetUsersPagedAsync(int page, int pageSize, string? search, string? kycStatus, string? tier, string? status)
    {
        // Build the base query sorted by name
        var query = _authDb.Users.Where(u => u.Role == "User").AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.ToLower();
            query = query.Where(u => u.FullName.ToLower().Contains(q) || u.Email.ToLower().Contains(q));
        }

        if (!string.IsNullOrWhiteSpace(kycStatus))
            query = query.Where(u => u.KycStatus == kycStatus);

        if (!string.IsNullOrWhiteSpace(status))
        {
            var isActive = status == "active";
            query = query.Where(u => u.IsActive == isActive);
        }

        var totalCount = await query.CountAsync();

        var users = await query
            .OrderBy(u => u.FullName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var userIds = users.Select(u => u.UserId).ToList();

        // Only load rewards for the current page
        var rewards = await _rewardsDb.RewardAccounts
            .Where(r => userIds.Contains(r.UserId))
            .ToListAsync();

        // Apply tier filter after join (tier lives in rewards DB)
        var items = users.Select(u =>
        {
            var reward = rewards.FirstOrDefault(r => r.UserId == u.UserId);
            return new
            {
                u.UserId,
                u.FullName,
                u.Email,
                u.Phone,
                u.Role,
                u.KycStatus,
                u.IsActive,
                u.InactiveReason,
                u.KycDocumentType,
                u.KycDocumentNumber,
                u.KycRejectionNote,
                u.KycReviewedAt,
                u.CreatedAt,
                Tier = reward?.Tier ?? "Silver"
            };
        }).AsEnumerable();

        if (!string.IsNullOrWhiteSpace(tier))
            items = items.Where(u => u.Tier == tier);

        var itemList = items.ToList();

        // Recalculate total when tier filter is applied (approximate — tier is cross-DB)
        var finalTotal = string.IsNullOrWhiteSpace(tier) ? totalCount : itemList.Count;

        var result = new
        {
            TotalCount = finalTotal,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(finalTotal / (double)pageSize),
            Items = itemList.Cast<object>().ToList()
        };

        return ApiResponse<object>.Ok(result);
    }

    public async Task<ApiResponse<string>> UpdateUserStatusAsync(Guid userId, bool isActive, string? reason, Guid adminUserId)
    {
        var user = await _authDb.Users.FirstOrDefaultAsync(u => u.UserId == userId && u.Role == "User");
        if (user == null)
        {
            return ApiResponse<string>.Fail("User not found.");
        }

        if (!isActive && string.IsNullOrWhiteSpace(reason))
        {
            return ApiResponse<string>.Fail("Reason is required when setting a user inactive.");
        }

        if (user.IsActive == isActive)
        {
            return ApiResponse<string>.Ok($"User is already {(isActive ? "active" : "inactive")}.");
        }

        user.IsActive = isActive;
        user.InactiveReason = isActive ? null : reason?.Trim();
        await _authDb.SaveChangesAsync();

        var log = new AuditLog
        {
            AdminUserId = adminUserId,
            Action = isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
            Notes = isActive
                ? $"UserId: {userId}"
                : $"UserId: {userId}, Reason: {user.InactiveReason}"
        };
        _rewardsDb.AuditLogs.Add(log);
        await _rewardsDb.SaveChangesAsync();

        await _publishEndpoint.Publish(new UserStatusChangedEvent(
            user.UserId,
            user.Email,
            user.FullName,
            user.IsActive,
            user.InactiveReason,
            DateTime.UtcNow));

        return ApiResponse<string>.Ok($"User {(isActive ? "activated" : "deactivated")} successfully.");
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

    public async Task<ApiResponse<List<Campaign>>> GetCampaignsAsync()
    {
        var campaigns = await _rewardsDb.Campaigns
            .OrderByDescending(c => c.StartDate)
            .ThenByDescending(c => c.CreatedAt)
            .ToListAsync();

        return ApiResponse<List<Campaign>>.Ok(campaigns);
    }

    public async Task<ApiResponse<string>> DeactivateCampaignAsync(Guid campaignId, Guid adminUserId)
    {
        var campaign = await _rewardsDb.Campaigns.FirstOrDefaultAsync(c => c.CampaignId == campaignId);
        if (campaign == null)
        {
            return ApiResponse<string>.Fail("Campaign not found.");
        }

        if (!campaign.IsActive)
        {
            return ApiResponse<string>.Ok("Campaign is already inactive.");
        }

        campaign.IsActive = false;

        _rewardsDb.AuditLogs.Add(new AuditLog
        {
            AdminUserId = adminUserId,
            Action = "CAMPAIGN_DEACTIVATED",
            Notes = $"CampaignId: {campaign.CampaignId}, Name: {campaign.Name}"
        });

        await _rewardsDb.SaveChangesAsync();
        return ApiResponse<string>.Ok("Campaign deactivated successfully.");
    }

    public async Task<ApiResponse<string>> ActivateCampaignAsync(Guid campaignId, Guid adminUserId)
    {
        var campaign = await _rewardsDb.Campaigns.FirstOrDefaultAsync(c => c.CampaignId == campaignId);
        if (campaign == null)
        {
            return ApiResponse<string>.Fail("Campaign not found.");
        }

        if (campaign.IsActive)
        {
            return ApiResponse<string>.Ok("Campaign is already active.");
        }

        campaign.IsActive = true;

        _rewardsDb.AuditLogs.Add(new AuditLog
        {
            AdminUserId = adminUserId,
            Action = "CAMPAIGN_ACTIVATED",
            Notes = $"CampaignId: {campaign.CampaignId}, Name: {campaign.Name}"
        });

        await _rewardsDb.SaveChangesAsync();
        return ApiResponse<string>.Ok("Campaign activated successfully.");
    }

    public async Task<ApiResponse<string>> RemoveCampaignAsync(Guid campaignId, Guid adminUserId)
    {
        var campaign = await _rewardsDb.Campaigns.FirstOrDefaultAsync(c => c.CampaignId == campaignId);
        if (campaign == null)
        {
            return ApiResponse<string>.Fail("Campaign not found.");
        }

        _rewardsDb.Campaigns.Remove(campaign);
        _rewardsDb.AuditLogs.Add(new AuditLog
        {
            AdminUserId = adminUserId,
            Action = "CAMPAIGN_REMOVED",
            Notes = $"CampaignId: {campaign.CampaignId}, Name: {campaign.Name}"
        });

        await _rewardsDb.SaveChangesAsync();
        return ApiResponse<string>.Ok("Campaign removed successfully.");
    }

    public async Task<ApiResponse<object>> CreateRewardAsync(CreateRewardDto dto, Guid adminUserId)
    {
        // Map points to validity window (1 to 4 months)
        var expiryMonths = dto.PointsCost <= 300 ? 1
            : dto.PointsCost <= 1000 ? 2
            : dto.PointsCost <= 3000 ? 3
            : 4;

        var createdAt = DateTime.UtcNow;
        var reward = new RewardCatalogItemView
        {
            ItemId = Guid.NewGuid(),
            Name = dto.Name.Trim(),
            Description = dto.Description,
            ItemType = dto.ItemType,
            PointsCost = dto.PointsCost,
            Stock = dto.Stock,
            IsActive = true,
            CreatedAt = createdAt,
            ExpiresAt = createdAt.AddMonths(expiryMonths)
        };

        _rewardsDb.CatalogItems.Add(reward);
        _rewardsDb.AuditLogs.Add(new AuditLog
        {
            AdminUserId = adminUserId,
            Action = "REWARD_CREATED",
            Notes = $"ItemId: {reward.ItemId}, Name: {reward.Name}, PointsCost: {reward.PointsCost}, ExpiresAt: {reward.ExpiresAt:O}"
        });

        await _rewardsDb.SaveChangesAsync();
        return ApiResponse<object>.Ok(new
        {
            reward.ItemId,
            reward.Name,
            reward.Description,
            reward.ItemType,
            reward.PointsCost,
            reward.Stock,
            reward.IsActive,
            reward.ExpiresAt,
            reward.CreatedAt
        }, "Reward created successfully.");
    }

    public async Task<ApiResponse<List<object>>> GetRewardsAsync()
    {
        var rewards = await _rewardsDb.CatalogItems
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        var hasMissingExpiry = false;
        foreach (var reward in rewards)
        {
            if (reward.ExpiresAt != null) continue;
            reward.ExpiresAt = reward.CreatedAt.AddMonths(GetRewardExpiryMonths(reward.PointsCost));
            hasMissingExpiry = true;
        }

        if (hasMissingExpiry)
        {
            await _rewardsDb.SaveChangesAsync();
        }

        var data = rewards.Select(r => (object)new
        {
            r.ItemId,
            r.Name,
            r.Description,
            r.ItemType,
            r.PointsCost,
            r.Stock,
            r.IsActive,
            r.ExpiresAt,
            r.CreatedAt
        }).ToList();

        return ApiResponse<List<object>>.Ok(data);
    }

    public async Task<ApiResponse<string>> DeactivateRewardAsync(Guid rewardId, Guid adminUserId)
    {
        var reward = await _rewardsDb.CatalogItems.FirstOrDefaultAsync(r => r.ItemId == rewardId);
        if (reward == null)
        {
            return ApiResponse<string>.Fail("Reward not found.");
        }

        if (!reward.IsActive)
        {
            return ApiResponse<string>.Ok("Reward already inactive.");
        }

        reward.IsActive = false;
        _rewardsDb.AuditLogs.Add(new AuditLog
        {
            AdminUserId = adminUserId,
            Action = "REWARD_DEACTIVATED",
            Notes = $"RewardId: {reward.ItemId}, Name: {reward.Name}"
        });
        await _rewardsDb.SaveChangesAsync();
        return ApiResponse<string>.Ok("Reward deactivated successfully.");
    }

    public async Task<ApiResponse<string>> ActivateRewardAsync(Guid rewardId, Guid adminUserId)
    {
        var reward = await _rewardsDb.CatalogItems.FirstOrDefaultAsync(r => r.ItemId == rewardId);
        if (reward == null)
        {
            return ApiResponse<string>.Fail("Reward not found.");
        }

        if (reward.IsActive)
        {
            return ApiResponse<string>.Ok("Reward already active.");
        }

        reward.IsActive = true;
        _rewardsDb.AuditLogs.Add(new AuditLog
        {
            AdminUserId = adminUserId,
            Action = "REWARD_ACTIVATED",
            Notes = $"RewardId: {reward.ItemId}, Name: {reward.Name}"
        });
        await _rewardsDb.SaveChangesAsync();
        return ApiResponse<string>.Ok("Reward activated successfully.");
    }

    public async Task<ApiResponse<string>> RemoveRewardAsync(Guid rewardId, Guid adminUserId)
    {
        var reward = await _rewardsDb.CatalogItems.FirstOrDefaultAsync(r => r.ItemId == rewardId);
        if (reward == null)
        {
            return ApiResponse<string>.Fail("Reward not found.");
        }

        _rewardsDb.CatalogItems.Remove(reward);
        _rewardsDb.AuditLogs.Add(new AuditLog
        {
            AdminUserId = adminUserId,
            Action = "REWARD_REMOVED",
            Notes = $"RewardId: {reward.ItemId}, Name: {reward.Name}"
        });
        await _rewardsDb.SaveChangesAsync();
        return ApiResponse<string>.Ok("Reward removed successfully.");
    }
}
