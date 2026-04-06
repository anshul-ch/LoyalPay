using LoyalPay.RewardsService.Domain.Entities;

namespace LoyalPay.RewardsService.Domain.Interfaces;

public interface IRedemptionRepository
{
    Task<List<Redemption>> GetRedemptionsByUserIdAsync(Guid userId);
    Task AddRedemptionAsync(Redemption redemption);
    Task UpdateRedemptionAsync(Redemption redemption);
    Task SaveChangesAsync();
}
