using LoyalPay.WalletService.Domain.Entities;

namespace LoyalPay.WalletService.Domain.Interfaces;

public interface ITransferRequestRepository
{
    Task<TransferRequest?> GetTransferByIdAsync(Guid transferId);
    Task<List<TransferRequest>> GetTransfersByUserIdAsync(Guid userId);
    Task AddTransferRequestAsync(TransferRequest transferRequest);
    Task UpdateTransferRequestAsync(TransferRequest transferRequest);
    Task SaveChangesAsync();
}
