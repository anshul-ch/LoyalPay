using LoyalPay.RewardsService.Application.DTOs;
using LoyalPay.RewardsService.Application.Interfaces;
using LoyalPay.RewardsService.Domain.Entities;
using LoyalPay.RewardsService.Domain.Interfaces;
using LoyalPay.Shared.Common;
using LoyalPay.Shared.Events;
using MassTransit;
using System.Globalization;
using System.Text.RegularExpressions;

namespace LoyalPay.RewardsService.Application.Services;

public class RewardsService : IRewardsService
{
    private readonly IRewardAccountRepository _rewardAccountRepository;
    private readonly ICatalogItemRepository _catalogRepository;
    private readonly IRedemptionRepository _redemptionRepository;
    private readonly IRewardTransactionRepository _rewardTransactionRepository;
    private readonly IPublishEndpoint _publishEndpoint;

    public RewardsService(IRewardAccountRepository rewardAccountRepository, ICatalogItemRepository catalogRepository,
        IRedemptionRepository redemptionRepository, IRewardTransactionRepository rewardTransactionRepository,
        IPublishEndpoint publishEndpoint)
    {
        _rewardAccountRepository = rewardAccountRepository;
        _catalogRepository = catalogRepository;
        _redemptionRepository = redemptionRepository;
        _rewardTransactionRepository = rewardTransactionRepository;
        _publishEndpoint = publishEndpoint;
    }

    private static decimal ParseCashbackAmount(CatalogItem item)
    {
        var source = $"{item.Name} {item.Description}";
        var match = Regex.Match(source, @"\d+(?:\.\d{1,2})?");
        if (!match.Success)
        {
            return 0m;
        }

        if (!decimal.TryParse(match.Value, NumberStyles.Number, CultureInfo.InvariantCulture, out var amount))
        {
            return 0m;
        }

        return Math.Max(0m, amount);
    }

    private static int GetRewardExpiryMonths(int pointsCost)
    {
        if (pointsCost <= 300) return 1;
        if (pointsCost <= 1000) return 2;
        if (pointsCost <= 3000) return 3;
        return 4;
    }

    private async Task RemoveExpiredRewardsAsync()
    {
        var expired = await _catalogRepository.GetExpiredCatalogItemsAsync(DateTime.UtcNow);
        if (expired.Count == 0)
        {
            return;
        }

        await _catalogRepository.RemoveCatalogItemsAsync(expired);
        await _catalogRepository.SaveChangesAsync();
    }

    private string GetTier(int points)
    {
        if (points >= 5000)
        {
            return "Platinum";
        }

        if (points >= 1000)
        {
            return "Gold";
        }

        return "Silver";
    }

    private string GetTierProgress(int points)
    {
        if (points >= 5000)
        {
            return "You're at the highest tier!";
        }

        if (points >= 1000)
        {
            return (5000 - points) + " more points to reach Platinum";
        }

        return (1000 - points) + " more points to reach Gold";
    }

    public async Task<ApiResponse<RewardSummaryDto>> GetSummaryAsync(Guid userId)
    {
        var account = await _rewardAccountRepository.GetRewardAccountByUserIdAsync(userId);
        if (account == null)
        {
            return ApiResponse<RewardSummaryDto>.Fail("Reward account not found.");
        }

        var tier = GetTier(account.TotalPoints);
        var progress = GetTierProgress(account.TotalPoints);

        var summary = new RewardSummaryDto();
        summary.TotalPoints = account.TotalPoints;
        summary.Tier = tier;
        summary.TierProgress = progress;

        return ApiResponse<RewardSummaryDto>.Ok(summary);
    }

    public async Task<ApiResponse<List<CatalogItemDto>>> GetCatalogAsync()
    {
        await RemoveExpiredRewardsAsync();

        var items = await _catalogRepository.GetAllCatalogItemsAsync();

        var hasMissingExpiry = false;
        foreach (var item in items)
        {
            if (item.ExpiresAt != null) continue;
            item.ExpiresAt = item.CreatedAt.AddMonths(GetRewardExpiryMonths(item.PointsCost));
            hasMissingExpiry = true;
        }

        if (hasMissingExpiry)
        {
            await _catalogRepository.SaveChangesAsync();
        }

        var catalog = items.Select(item => new CatalogItemDto
        {
            ItemId = item.ItemId,
            Name = item.Name,
            Description = item.Description,
            ItemType = item.ItemType,
            PointsCost = item.PointsCost,
            IsActive = item.IsActive,
            ExpiresAt = item.ExpiresAt
        }).ToList();

        return ApiResponse<List<CatalogItemDto>>.Ok(catalog);
    }

    public async Task<ApiResponse<string>> RedeemAsync(Guid userId, RedeemDto dto)
    {
        var account = await _rewardAccountRepository.GetRewardAccountByUserIdAsync(userId);
        if (account == null)
        {
            return ApiResponse<string>.Fail("Reward account not found.");
        }

        var item = await _catalogRepository.GetCatalogItemByIdAsync(dto.ItemId);
        if (item == null)
        {
            return ApiResponse<string>.Fail("Item not found in catalog.");
        }

        if (!item.IsActive)
        {
            return ApiResponse<string>.Fail("This item is currently unavailable.");
        }

        if (account.TotalPoints < item.PointsCost)
        {
            return ApiResponse<string>.Fail("Insufficient points for this redemption.");
        }

        // Decrement stock for finite-stock items (-1 means unlimited).
        if (item.Stock > 0)
        {
            item.Stock -= 1;
        }
        else if (item.Stock == 0)
        {
            return ApiResponse<string>.Fail("This item is out of stock.");
        }

        // Deduction and ledger-like records are committed in the same save path.

        account.TotalPoints = account.TotalPoints - item.PointsCost;
        account.Tier = GetTier(account.TotalPoints);
        account.UpdatedAt = DateTime.UtcNow;

        var redemption = new Redemption();
        redemption.UserId = userId;
        redemption.ItemId = dto.ItemId;
        redemption.PointsSpent = item.PointsCost;
        redemption.CreatedAt = DateTime.UtcNow;

        var transaction = new RewardTransaction();
        transaction.UserId = userId;
        transaction.TxnType = "Redemption";
        transaction.Points = -item.PointsCost;
        transaction.Description = "Redeemed: " + item.Name;
        transaction.CreatedAt = DateTime.UtcNow;

        await _rewardAccountRepository.UpdateRewardAccountAsync(account);
        await _redemptionRepository.AddRedemptionAsync(redemption);
        await _rewardTransactionRepository.AddRewardTransactionAsync(transaction);
        await _rewardAccountRepository.SaveChangesAsync();

        if (string.Equals(item.ItemType, "Cashback", StringComparison.OrdinalIgnoreCase))
        {
            var cashbackAmount = ParseCashbackAmount(item);
            if (cashbackAmount > 0)
            {
                await _publishEndpoint.Publish(new CashbackRedeemedEvent(
                    userId,
                    item.ItemId,
                    item.Name,
                    cashbackAmount
                ));
            }
        }

        return ApiResponse<string>.Ok("Redemption successful! Your request is being processed.");
    }

    public async Task<ApiResponse<List<RewardTransactionDto>>> GetHistoryAsync(Guid userId)
    {
        var transactions = await _rewardTransactionRepository.GetTransactionsByUserIdAsync(userId);

        var history = transactions.Select(t => new RewardTransactionDto
        {
            TransactionId = t.TxnId,
            TransactionType = t.TxnType,
            Points = t.Points,
            Description = t.Description ?? "",
            CreatedAt = t.CreatedAt
        }).ToList();

        return ApiResponse<List<RewardTransactionDto>>.Ok(history);
    }

    public async Task AddPointsAsync(Guid userId, int points, string description)
    {
        var account = await _rewardAccountRepository.GetRewardAccountByUserIdAsync(userId);
        if (account == null)
        {
            account = new RewardAccount();
            account.UserId = userId;
            account.TotalPoints = 0;
            account.Tier = "Silver";
            account.CreatedAt = DateTime.UtcNow;
            account.UpdatedAt = DateTime.UtcNow;

            await _rewardAccountRepository.AddRewardAccountAsync(account);
        }

        account.TotalPoints = account.TotalPoints + points;
        account.Tier = GetTier(account.TotalPoints);
        account.UpdatedAt = DateTime.UtcNow;

        var transaction = new RewardTransaction();
        transaction.UserId = userId;
        transaction.TxnType = "Earned";
        transaction.Points = points;
        transaction.Description = description;
        transaction.CreatedAt = DateTime.UtcNow;

        await _rewardAccountRepository.UpdateRewardAccountAsync(account);
        await _rewardTransactionRepository.AddRewardTransactionAsync(transaction);
        await _rewardAccountRepository.SaveChangesAsync();
    }
}
