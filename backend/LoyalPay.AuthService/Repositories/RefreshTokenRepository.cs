using LoyalPay.AuthService.Data;
using LoyalPay.AuthService.Models;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.AuthService.Repositories;

public class RefreshTokenRepository : IRefreshTokenRepository
{
    private readonly AuthDbContext _db;

    public RefreshTokenRepository(AuthDbContext db)
    {
        _db = db;
    }

    public async Task<RefreshToken?> GetRefreshTokenAsync(string token)
    {
        return await _db.RefreshTokens.FirstOrDefaultAsync(t => t.Token == token);
    }

    public async Task<RefreshToken?> GetRefreshTokenWithUserAsync(string token)
    {
        return await _db.RefreshTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == token && !t.IsRevoked);
    }

    public async Task<List<RefreshToken>> GetActiveTokensByUserIdAsync(Guid userId)
    {
        return await _db.RefreshTokens
            .Where(t => t.UserId == userId && !t.IsRevoked)
            .ToListAsync();
    }

    public async Task AddRefreshTokenAsync(RefreshToken refreshToken)
    {
        _db.RefreshTokens.Add(refreshToken);
    }

    public async Task UpdateRefreshTokenAsync(RefreshToken refreshToken)
    {
        _db.RefreshTokens.Update(refreshToken);
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}