using LoyalPay.RewardsService.Application.DTOs;
using LoyalPay.Shared.Common;

namespace LoyalPay.RewardsService.Application.Interfaces;

public interface IRewardsService
{
    Task<ApiResponse<RewardSummaryDto>> GetSummaryAsync(Guid userId);

    Task<ApiResponse<List<CatalogItemDto>>> GetCatalogAsync();

    /// <summary>
    /// Debits points and records redemption/transaction entries in one operation.
    /// </summary>
    /// <returns>
    /// Failure when the account or item is missing, the item is inactive,
    /// or the user has insufficient points. Success otherwise.
    /// </returns>
    Task<ApiResponse<string>> RedeemAsync(Guid userId, RedeemDto dto);

    Task<ApiResponse<List<RewardTransactionDto>>> GetHistoryAsync(Guid userId);

    /// <summary>
    /// Adds points to the account, creating a default Silver account when one does not exist.
    /// Called internally by the messaging consumers.
    /// </summary>
    Task AddPointsAsync(Guid userId, int points, string description);
}
