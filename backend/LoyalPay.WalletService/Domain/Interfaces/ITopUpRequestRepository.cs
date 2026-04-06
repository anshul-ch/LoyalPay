using LoyalPay.WalletService.Domain.Entities;

namespace LoyalPay.WalletService.Domain.Interfaces;

public interface ITopUpRequestRepository
{
    Task<TopUpRequest?> GetTopUpByIdAsync(Guid topUpId);
    Task<TopUpRequest?> GetTopUpByIdWithWalletAsync(Guid topUpId);
    Task<List<TopUpRequest>> GetTopUpsByUserIdAsync(Guid userId);
    Task<decimal> GetTodaysTotalForWalletAsync(Guid walletId, DateTime todayStart);
    Task AddTopUpRequestAsync(TopUpRequest topUpRequest);
    Task UpdateTopUpRequestAsync(TopUpRequest topUpRequest);
    Task SaveChangesAsync();
}
