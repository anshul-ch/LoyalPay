using LoyalPay.RewardsService.Data;
using LoyalPay.RewardsService.DTOs;
using LoyalPay.RewardsService.Models;
using LoyalPay.Shared.Common;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.RewardsService.Services;

public class RewardsService
{
    private readonly RewardsDbContext _db;

    public RewardsService(RewardsDbContext db)
    {
        _db = db;
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
        var account = await _db.RewardAccounts.FirstOrDefaultAsync(r => r.UserId == userId);
        if (account == null)
        {
            return ApiResponse<RewardSummaryDto>.Fail("Reward account not found.");
        }

        var dto = new RewardSummaryDto();
        dto.TotalPoints = account.TotalPoints;
        dto.Tier = account.Tier;
        dto.TierProgress = GetTierProgress(account.TotalPoints);

        return ApiResponse<RewardSummaryDto>.Ok(dto);
    }

    public async Task<ApiResponse<List<CatalogItem>>> GetCatalogAsync()
    {
        var items = await _db.CatalogItems.Where(i => i.IsActive).ToListAsync();
        return ApiResponse<List<CatalogItem>>.Ok(items);
    }

    public async Task<ApiResponse<object>> RedeemAsync(Guid userId, RedeemDto dto)
    {
        var account = await _db.RewardAccounts.FirstOrDefaultAsync(r => r.UserId == userId);
        if (account == null)
        {
            return ApiResponse<object>.Fail("Reward account not found.");
        }

        var item = await _db.CatalogItems.FindAsync(dto.ItemId);
        if (item == null || !item.IsActive)
        {
            return ApiResponse<object>.Fail("Item not available.");
        }

        if (item.Stock == 0)
        {
            return ApiResponse<object>.Fail("Out of stock.");
        }

        if (account.TotalPoints < item.PointsCost)
        {
            return ApiResponse<object>.Fail("Not enough points. Need " + item.PointsCost + ", you have " + account.TotalPoints + ".");
        }

        account.TotalPoints = account.TotalPoints - item.PointsCost;
        account.Tier = GetTier(account.TotalPoints);
        account.UpdatedAt = DateTime.UtcNow;

        if (item.Stock > 0)
        {
            item.Stock = item.Stock - 1;
        }

        string? couponCode = null;
        if (item.ItemType == "Coupon")
        {
            couponCode = "LP-" + Guid.NewGuid().ToString("N")[..8].ToUpper();
        }

        var redemption = new Redemption();
        redemption.UserId = userId;
        redemption.ItemId = item.ItemId;
        redemption.PointsSpent = item.PointsCost;
        redemption.CouponCode = couponCode;
        _db.Redemptions.Add(redemption);

        var transaction = new RewardTransaction();
        transaction.UserId = userId;
        transaction.TxnType = "REDEEM";
        transaction.Points = -item.PointsCost;
        transaction.Description = "Redeemed: " + item.Name;
        _db.RewardTransactions.Add(transaction);

        await _db.SaveChangesAsync();

        var data = new
        {
            Message = "Redeemed successfully!",
            CouponCode = couponCode,
            PointsSpent = item.PointsCost,
            RemainingPoints = account.TotalPoints
        };

        return ApiResponse<object>.Ok(data);
    }

    public async Task<ApiResponse<List<RewardTransaction>>> GetHistoryAsync(Guid userId)
    {
        var history = await _db.RewardTransactions
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        return ApiResponse<List<RewardTransaction>>.Ok(history);
    }
}
