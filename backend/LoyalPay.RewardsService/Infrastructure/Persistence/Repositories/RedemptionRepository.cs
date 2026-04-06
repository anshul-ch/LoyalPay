using LoyalPay.RewardsService.Domain.Entities;
using LoyalPay.RewardsService.Domain.Interfaces;
using LoyalPay.RewardsService.Infrastructure.Persistence.DbContext;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.RewardsService.Infrastructure.Persistence.Repositories;

public class RedemptionRepository : IRedemptionRepository
{
    private readonly RewardsDbContext _db;

    public RedemptionRepository(RewardsDbContext db)
    {
        _db = db;
    }

    public async Task<List<Redemption>> GetRedemptionsByUserIdAsync(Guid userId)
    {
        return await _db.Redemptions
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task AddRedemptionAsync(Redemption redemption)
    {
        _db.Redemptions.Add(redemption);
    }

    public async Task UpdateRedemptionAsync(Redemption redemption)
    {
        _db.Redemptions.Update(redemption);
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}
