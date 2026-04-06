using LoyalPay.AdminService.Application.DTOs;
using LoyalPay.AdminService.Domain.Entities;
using LoyalPay.Shared.Common;

namespace LoyalPay.AdminService.Application.Interfaces;

public interface IAdminService
{
    Task<ApiResponse<List<object>>> GetPendingKycAsync();
    /// <summary>
    /// Applies KYC decision to Auth DB and writes an audit record in Rewards DB.
    /// </summary>

    Task<ApiResponse<string>> ReviewKycAsync(Guid userId, KycReviewDto dto, Guid adminUserId);

    /// <summary>
    /// Creates a campaign and records the action in the admin audit log.
    /// </summary>

    Task<ApiResponse<Campaign>> CreateCampaignAsync(CampaignDto dto, Guid adminUserId);
    Task<ApiResponse<object>> GetDashboardAsync();
    Task<ApiResponse<List<object>>> GetUsersAsync();
}
