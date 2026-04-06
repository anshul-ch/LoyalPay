using LoyalPay.WalletService.Domain.Entities;

namespace LoyalPay.WalletService.Domain.Interfaces;

public interface IWalletAccountRepository
{
    Task<WalletAccount?> GetWalletByUserIdAsync(Guid userId);
    Task<WalletAccount?> GetWalletByIdAsync(Guid walletId);
    Task AddWalletAsync(WalletAccount wallet);
    Task UpdateWalletAsync(WalletAccount wallet);
    Task SaveChangesAsync();
}
