using LoyalPay.WalletService.Domain.Entities;
using LoyalPay.WalletService.Domain.Interfaces;
using LoyalPay.WalletService.Infrastructure.Persistence.DbContext;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.WalletService.Infrastructure.Persistence.Repositories;

public class TopUpRequestRepository : ITopUpRequestRepository
{
    private readonly WalletDbContext _db;

    public TopUpRequestRepository(WalletDbContext db)
    {
        _db = db;
    }

    public async Task<TopUpRequest?> GetTopUpByIdAsync(Guid topUpId)
    {
        return await _db.TopUpRequests.FindAsync(topUpId);
    }

    public async Task<TopUpRequest?> GetTopUpByIdWithWalletAsync(Guid topUpId)
    {
        return await _db.TopUpRequests
            .Include(t => t.WalletAccount)
            .FirstOrDefaultAsync(t => t.TopUpId == topUpId);
    }

    public async Task<List<TopUpRequest>> GetTopUpsByUserIdAsync(Guid userId)
    {
        return await _db.TopUpRequests
            .Include(t => t.WalletAccount)
            .Where(t => t.WalletAccount.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<decimal> GetTodaysTotalForWalletAsync(Guid walletId, DateTime todayStart)
    {
        return await _db.TopUpRequests
            .Where(t => t.WalletId == walletId && t.Status == "Success" && t.CreatedAt >= todayStart)
            .SumAsync(t => (decimal?)t.Amount) ?? 0;
    }

    public async Task AddTopUpRequestAsync(TopUpRequest topUpRequest)
    {
        _db.TopUpRequests.Add(topUpRequest);
    }

    public async Task UpdateTopUpRequestAsync(TopUpRequest topUpRequest)
    {
        _db.TopUpRequests.Update(topUpRequest);
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}
