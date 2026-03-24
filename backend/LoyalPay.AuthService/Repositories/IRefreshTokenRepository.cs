using LoyalPay.AuthService.Models;

namespace LoyalPay.AuthService.Repositories;

public interface IRefreshTokenRepository
{
    Task<RefreshToken?> GetRefreshTokenAsync(string token);
    Task<RefreshToken?> GetRefreshTokenWithUserAsync(string token);
    Task<List<RefreshToken>> GetActiveTokensByUserIdAsync(Guid userId);
    Task AddRefreshTokenAsync(RefreshToken refreshToken);
    Task UpdateRefreshTokenAsync(RefreshToken refreshToken);
    Task SaveChangesAsync();
}