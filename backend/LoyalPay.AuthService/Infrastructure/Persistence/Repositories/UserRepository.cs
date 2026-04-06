using LoyalPay.AuthService.Domain.Entities;
using LoyalPay.AuthService.Domain.Interfaces;
using LoyalPay.AuthService.Infrastructure.Persistence.DbContext;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.AuthService.Infrastructure.Persistence.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AuthDbContext _db;

    public UserRepository(AuthDbContext db)
    {
        _db = db;
    }

    public async Task<User?> GetUserByIdAsync(Guid userId)
    {
        return await _db.Users.FindAsync(userId);
    }

    public async Task<User?> GetUserByEmailAsync(string email)
    {
        return await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<bool> UserExistsAsync(string email)
    {
        return await _db.Users.AnyAsync(u => u.Email == email);
    }

    public async Task AddUserAsync(User user)
    {
        _db.Users.Add(user);
    }

    public async Task UpdateUserAsync(User user)
    {
        _db.Users.Update(user);
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}
