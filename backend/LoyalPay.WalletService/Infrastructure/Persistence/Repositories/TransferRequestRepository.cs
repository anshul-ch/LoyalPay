using LoyalPay.WalletService.Domain.Entities;
using LoyalPay.WalletService.Domain.Interfaces;
using LoyalPay.WalletService.Infrastructure.Persistence.DbContext;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.WalletService.Infrastructure.Persistence.Repositories;

public class TransferRequestRepository : ITransferRequestRepository
{
    private readonly WalletDbContext _db;

    public TransferRequestRepository(WalletDbContext db)
    {
        _db = db;
    }

    public async Task<TransferRequest?> GetTransferByIdAsync(Guid transferId)
    {
        return await _db.TransferRequests.FindAsync(transferId);
    }

    public async Task<List<TransferRequest>> GetTransfersByUserIdAsync(Guid userId)
    {
        var senderTransfers = await _db.TransferRequests
            .Join(_db.WalletAccounts, t => t.SenderWalletId, w => w.WalletId, (t, w) => new { t, w })
            .Where(x => x.w.UserId == userId)
            .Select(x => x.t)
            .ToListAsync();

        var receiverTransfers = await _db.TransferRequests
            .Join(_db.WalletAccounts, t => t.ReceiverWalletId, w => w.WalletId, (t, w) => new { t, w })
            .Where(x => x.w.UserId == userId)
            .Select(x => x.t)
            .ToListAsync();

        var allTransfers = senderTransfers.Union(receiverTransfers).ToList();
        return allTransfers.OrderByDescending(t => t.CreatedAt).ToList();
    }

    public async Task AddTransferRequestAsync(TransferRequest transferRequest)
    {
        _db.TransferRequests.Add(transferRequest);
    }

    public async Task UpdateTransferRequestAsync(TransferRequest transferRequest)
    {
        _db.TransferRequests.Update(transferRequest);
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}
