using LoyalPay.AdminService.Domain.Entities;
using LoyalPay.AdminService.Infrastructure.Persistence.DbContext;

namespace LoyalPay.AdminService.Application.Services;

public class SeedData
{
    public static void EnsureAdmin(AdminAuthDbContext authDb)
    {
        var adminExists = authDb.Users.Any(u => u.Role == "Admin");
        if (adminExists)
        {
            return;
        }

        var admin = new UserView();
        admin.FullName = "Super Admin";
        admin.Email = "admin@loyalpay.com";
        admin.Phone = "9000000000";
        admin.PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123", workFactor: 10);
        admin.Role = "Admin";
        admin.IsActive = true;
        admin.KycStatus = "Approved";

        authDb.Users.Add(admin);
        authDb.SaveChanges();
    }
}
