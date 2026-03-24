using LoyalPay.WalletService.Models;

namespace LoyalPay.WalletService.Repositories;

public interface ITransferRequestRepository
{
    Task<TransferRequest?> GetTransferByIdAsync(Guid transferId);
    Task<List<TransferRequest>> GetTransfersByUserIdAsync(Guid userId);
    Task AddTransferRequestAsync(TransferRequest transferRequest);
    Task UpdateTransferRequestAsync(TransferRequest transferRequest);
    Task SaveChangesAsync();
}