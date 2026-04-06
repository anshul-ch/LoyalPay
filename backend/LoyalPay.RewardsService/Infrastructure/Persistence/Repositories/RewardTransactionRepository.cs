using LoyalPay.RewardsService.Domain.Entities;
using LoyalPay.RewardsService.Domain.Interfaces;
using LoyalPay.RewardsService.Infrastructure.Persistence.DbContext;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.RewardsService.Infrastructure.Persistence.Repositories;

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
