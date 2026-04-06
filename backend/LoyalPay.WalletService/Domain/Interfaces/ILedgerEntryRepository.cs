using LoyalPay.WalletService.Domain.Entities;

namespace LoyalPay.WalletService.Domain.Interfaces;

public interface ILedgerEntryRepository
{
    Task<List<LedgerEntry>> GetTransactionsByUserIdAsync(Guid userId, int page, int pageSize);
    Task<List<LedgerEntry>> GetTransactionsByWalletIdAsync(Guid walletId, int page, int pageSize);
    Task<List<LedgerEntry>> GetTransactionsByDateRangeAsync(Guid userId, DateTime startDate, DateTime endDate);
    Task<int> GetTransactionCountByWalletIdAsync(Guid walletId);
    Task AddLedgerEntryAsync(LedgerEntry ledgerEntry);
    Task SaveChangesAsync();
}
