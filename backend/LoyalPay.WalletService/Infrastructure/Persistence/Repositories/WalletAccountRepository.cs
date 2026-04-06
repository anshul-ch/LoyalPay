using LoyalPay.WalletService.Domain.Entities;
using LoyalPay.WalletService.Domain.Interfaces;
using LoyalPay.WalletService.Infrastructure.Persistence.DbContext;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.WalletService.Infrastructure.Persistence.Repositories;

public class WalletAccountRepository : IWalletAccountRepository
{
    private readonly WalletDbContext _db;

    public WalletAccountRepository(WalletDbContext db)
    {
        _db = db;
    }

    public async Task<WalletAccount?> GetWalletByUserIdAsync(Guid userId)
    {
        return await _db.WalletAccounts.FirstOrDefaultAsync(w => w.UserId == userId);
    }

    public async Task<WalletAccount?> GetWalletByIdAsync(Guid walletId)
    {
        return await _db.WalletAccounts.FindAsync(walletId);
    }

    public async Task AddWalletAsync(WalletAccount wallet)
    {
        _db.WalletAccounts.Add(wallet);
    }

    public async Task UpdateWalletAsync(WalletAccount wallet)
    {
        _db.WalletAccounts.Update(wallet);
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}
