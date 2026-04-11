using LoyalPay.WalletService.Domain.Entities;

namespace LoyalPay.WalletService.Domain.Interfaces;

public interface IUserVerificationRepository
{
    Task<UserVerificationView?> GetByUserIdAsync(Guid userId);
}
