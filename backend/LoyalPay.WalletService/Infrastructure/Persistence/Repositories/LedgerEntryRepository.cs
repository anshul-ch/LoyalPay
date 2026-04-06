using LoyalPay.WalletService.Domain.Entities;
using LoyalPay.WalletService.Domain.Interfaces;
using LoyalPay.WalletService.Infrastructure.Persistence.DbContext;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.WalletService.Infrastructure.Persistence.Repositories;

public class LedgerEntryRepository : ILedgerEntryRepository
{
    private readonly WalletDbContext _db;

    public LedgerEntryRepository(WalletDbContext db)
    {
        _db = db;
    }

    public async Task<List<LedgerEntry>> GetTransactionsByUserIdAsync(Guid userId, int page, int pageSize)
    {
        return await _db.LedgerEntries
            .Join(_db.WalletAccounts, l => l.WalletId, w => w.WalletId, (l, w) => new { l, w })
            .Where(x => x.w.UserId == userId)
            .OrderByDescending(x => x.l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => x.l)
            .ToListAsync();
    }

    public async Task<List<LedgerEntry>> GetTransactionsByWalletIdAsync(Guid walletId, int page, int pageSize)
    {
        return await _db.LedgerEntries
            .Where(l => l.WalletId == walletId)
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<List<LedgerEntry>> GetTransactionsByDateRangeAsync(Guid userId, DateTime startDate, DateTime endDate)
    {
        return await _db.LedgerEntries
            .Join(_db.WalletAccounts, l => l.WalletId, w => w.WalletId, (l, w) => new { l, w })
            .Where(x => x.w.UserId == userId && x.l.CreatedAt >= startDate && x.l.CreatedAt <= endDate)
            .OrderByDescending(x => x.l.CreatedAt)
            .Select(x => x.l)
            .ToListAsync();
    }

    public async Task<int> GetTransactionCountByWalletIdAsync(Guid walletId)
    {
        return await _db.LedgerEntries.CountAsync(e => e.WalletId == walletId);
    }

    public async Task AddLedgerEntryAsync(LedgerEntry ledgerEntry)
    {
        _db.LedgerEntries.Add(ledgerEntry);
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}
