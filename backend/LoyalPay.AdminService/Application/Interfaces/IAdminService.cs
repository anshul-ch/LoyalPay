using LoyalPay.AdminService.Application.DTOs;
using LoyalPay.AdminService.Domain.Entities;
using LoyalPay.Shared.Common;
using LoyalPay.Shared.Entities;

namespace LoyalPay.AdminService.Application.Interfaces;

public interface IAdminService
{
    Task<ApiResponse<object>> GetDashboardAsync();
    Task<ApiResponse<List<object>>> GetUsersAsync();

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
}
