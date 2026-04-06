using LoyalPay.RewardsService.Domain.Entities;

namespace LoyalPay.RewardsService.Domain.Interfaces;

public interface IRewardAccountRepository
{
    Task<RewardAccount?> GetRewardAccountByUserIdAsync(Guid userId);
    Task AddRewardAccountAsync(RewardAccount rewardAccount);
    Task UpdateRewardAccountAsync(RewardAccount rewardAccount);
    Task SaveChangesAsync();
}
