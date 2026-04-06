using LoyalPay.AdminService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.AdminService.Infrastructure.Persistence.DbContext;

public class AdminWalletDbContext : Microsoft.EntityFrameworkCore.DbContext
{
    public AdminWalletDbContext(Microsoft.EntityFrameworkCore.DbContextOptions<AdminWalletDbContext> options) : base(options)
    {
    }

    public DbSet<WalletView> WalletAccounts { get; set; }
}
