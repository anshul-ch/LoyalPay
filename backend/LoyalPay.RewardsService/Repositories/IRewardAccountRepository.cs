using LoyalPay.RewardsService.Models;

namespace LoyalPay.RewardsService.Repositories;

public interface IRewardAccountRepository
{
    Task<RewardAccount?> GetRewardAccountByUserIdAsync(Guid userId);
    Task AddRewardAccountAsync(RewardAccount rewardAccount);
    Task UpdateRewardAccountAsync(RewardAccount rewardAccount);
    Task SaveChangesAsync();
}