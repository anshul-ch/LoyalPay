using LoyalPay.AdminService.Models;

namespace LoyalPay.AdminService.Repositories;

public interface IUserViewRepository
{
    Task<List<UserView>> GetAllUsersAsync();
    Task<UserView?> GetUserByIdAsync(Guid userId);
    Task SaveChangesAsync();
}