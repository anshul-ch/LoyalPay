using LoyalPay.AuthService.Domain.Entities;

namespace LoyalPay.AuthService.Domain.Interfaces;

public interface IUserRepository
{
    Task<User?> GetUserByIdAsync(Guid userId);
    Task<User?> GetUserByEmailAsync(string email);
    Task<bool> UserExistsAsync(string email);
    Task AddUserAsync(User user);
    Task UpdateUserAsync(User user);
    Task SaveChangesAsync();
}
