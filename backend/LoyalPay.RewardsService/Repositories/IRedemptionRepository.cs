using LoyalPay.RewardsService.Models;

namespace LoyalPay.RewardsService.Repositories;

public interface IRedemptionRepository
{
    Task<List<Redemption>> GetRedemptionsByUserIdAsync(Guid userId);
    Task AddRedemptionAsync(Redemption redemption);
    Task UpdateRedemptionAsync(Redemption redemption);
    Task SaveChangesAsync();
}