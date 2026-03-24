using LoyalPay.RewardsService.Data;
using LoyalPay.RewardsService.Models;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.RewardsService.Repositories;

public class RewardTransactionRepository : IRewardTransactionRepository
{
    private readonly RewardsDbContext _db;

    public RewardTransactionRepository(RewardsDbContext db)
    {
        _db = db;
    }

    public async Task<List<RewardTransaction>> GetTransactionsByUserIdAsync(Guid userId)
    {
        return await _db.RewardTransactions
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task AddRewardTransactionAsync(RewardTransaction rewardTransaction)
    {
        _db.RewardTransactions.Add(rewardTransaction);
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}