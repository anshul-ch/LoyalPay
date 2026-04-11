using LoyalPay.AdminService.Application.DTOs;
using LoyalPay.AdminService.Domain.Entities;
using LoyalPay.Shared.Common;
using LoyalPay.Shared.Entities;

namespace LoyalPay.AdminService.Application.Interfaces;

public interface IAdminService
{
    Task<ApiResponse<object>> GetDashboardAsync();
    Task<ApiResponse<object>> GetUsersPagedAsync(int page, int pageSize, string? search, string? kycStatus, string? tier, string? status);
    Task<ApiResponse<string>> UpdateUserStatusAsync(Guid userId, bool isActive, string? reason, Guid adminUserId);

    /// <summary>
    /// Returns all users with Pending KYC status, including their latest submission metadata.
    /// </summary>
    Task<ApiResponse<List<object>>> GetPendingKycAsync();

    /// <summary>
    /// Returns all KYC submissions for a specific user (full history).
    /// </summary>
    Task<ApiResponse<List<object>>> GetKycSubmissionsByUserAsync(Guid userId);

    /// <summary>
    /// Returns the raw document bytes for a specific KYC submission.
    /// </summary>
    Task<(byte[] Data, string ContentType, string FileName)?> GetKycDocumentAsync(Guid submissionId);

    /// <summary>
    /// Applies a KYC decision to the Auth DB and writes an audit record in the Rewards DB.
    /// </summary>
    Task<ApiResponse<string>> ReviewKycAsync(Guid submissionId, KycReviewDto dto, Guid adminUserId);

    /// <summary>
    /// Creates a campaign and records the action in the admin audit log.
    /// </summary>
    Task<ApiResponse<Campaign>> CreateCampaignAsync(CampaignDto dto, Guid adminUserId);

    /// <summary>
    /// Returns all campaigns (active and past) for admin visibility.
    /// </summary>
    Task<ApiResponse<List<Campaign>>> GetCampaignsAsync();

    /// <summary>
    /// Marks a campaign inactive (soft delete) and records audit trail.
    /// </summary>
    Task<ApiResponse<string>> DeactivateCampaignAsync(Guid campaignId, Guid adminUserId);

    /// <summary>
    /// Reactivates an inactive campaign.
    /// </summary>
    Task<ApiResponse<string>> ActivateCampaignAsync(Guid campaignId, Guid adminUserId);

    /// <summary>
    /// Permanently removes a campaign from database.
    /// </summary>
    Task<ApiResponse<string>> RemoveCampaignAsync(Guid campaignId, Guid adminUserId);

    Task<ApiResponse<object>> CreateRewardAsync(CreateRewardDto dto, Guid adminUserId);
    Task<ApiResponse<List<object>>> GetRewardsAsync();
    Task<ApiResponse<string>> DeactivateRewardAsync(Guid rewardId, Guid adminUserId);
    Task<ApiResponse<string>> ActivateRewardAsync(Guid rewardId, Guid adminUserId);
    Task<ApiResponse<string>> RemoveRewardAsync(Guid rewardId, Guid adminUserId);
}
