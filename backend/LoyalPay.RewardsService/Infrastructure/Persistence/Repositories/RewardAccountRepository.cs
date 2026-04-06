using LoyalPay.RewardsService.Domain.Entities;
using LoyalPay.RewardsService.Domain.Interfaces;
using LoyalPay.RewardsService.Infrastructure.Persistence.DbContext;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.RewardsService.Infrastructure.Persistence.Repositories;

public class RewardAccountRepository : IRewardAccountRepository
{
    private readonly RewardsDbContext _db;

    public RewardAccountRepository(RewardsDbContext db)
    {
        _db = db;
    }

    public async Task<RewardAccount?> GetRewardAccountByUserIdAsync(Guid userId)
    {
        return await _db.RewardAccounts.FirstOrDefaultAsync(r => r.UserId == userId);
    }

    public async Task AddRewardAccountAsync(RewardAccount rewardAccount)
    {
        _db.RewardAccounts.Add(rewardAccount);
    }

    public async Task UpdateRewardAccountAsync(RewardAccount rewardAccount)
    {
        _db.RewardAccounts.Update(rewardAccount);
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}
