using LoyalPay.WalletService.Models;

namespace LoyalPay.WalletService.Repositories;

public interface IWalletAccountRepository
{
    Task<WalletAccount?> GetWalletByUserIdAsync(Guid userId);
    Task<WalletAccount?> GetWalletByIdAsync(Guid walletId);
    Task AddWalletAsync(WalletAccount wallet);
    Task UpdateWalletAsync(WalletAccount wallet);
    Task SaveChangesAsync();
}