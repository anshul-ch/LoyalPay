using LoyalPay.AdminService.Models;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.AdminService.Data;

public class AdminWalletDbContext : DbContext
{
    public AdminWalletDbContext(DbContextOptions<AdminWalletDbContext> options) : base(options)
    {
    }

    public DbSet<WalletView> WalletAccounts { get; set; }
}
