using LoyalPay.RewardsService.Domain.Entities;

namespace LoyalPay.RewardsService.Domain.Interfaces;

public interface IRewardTransactionRepository
{
    Task<List<RewardTransaction>> GetTransactionsByUserIdAsync(Guid userId);
    Task AddRewardTransactionAsync(RewardTransaction rewardTransaction);
    Task SaveChangesAsync();
}
