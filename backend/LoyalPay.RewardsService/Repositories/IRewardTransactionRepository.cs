using LoyalPay.RewardsService.Models;

namespace LoyalPay.RewardsService.Repositories;

public interface IRewardTransactionRepository
{
    Task<List<RewardTransaction>> GetTransactionsByUserIdAsync(Guid userId);
    Task AddRewardTransactionAsync(RewardTransaction rewardTransaction);
    Task SaveChangesAsync();
}