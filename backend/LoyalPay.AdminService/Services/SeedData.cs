using LoyalPay.AdminService.Data;
using LoyalPay.AdminService.Models;

namespace LoyalPay.AdminService.Services;

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
        admin.PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123");
        admin.Role = "Admin";
        admin.IsActive = true;
        admin.KycStatus = "Approved";

        authDb.Users.Add(admin);
        authDb.SaveChanges();
    }
}
