using LoyalPay.WalletService.Domain.Entities;
using LoyalPay.WalletService.Domain.Interfaces;
using LoyalPay.WalletService.Infrastructure.Persistence.DbContext;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.WalletService.Infrastructure.Persistence.Repositories;

public class UserVerificationRepository : IUserVerificationRepository
{
    private readonly AuthReadDbContext _db;

    public UserVerificationRepository(AuthReadDbContext db)
    {
        _db = db;
    }

    public async Task<UserVerificationView?> GetByUserIdAsync(Guid userId)
    {
        return await _db.Users.FirstOrDefaultAsync(u => u.UserId == userId);
    }
}
