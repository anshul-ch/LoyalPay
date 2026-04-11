using LoyalPay.WalletService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.WalletService.Infrastructure.Persistence.DbContext;

public class AuthReadDbContext : Microsoft.EntityFrameworkCore.DbContext
{
    public AuthReadDbContext(DbContextOptions<AuthReadDbContext> options) : base(options)
    {
    }

    public DbSet<UserVerificationView> Users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserVerificationView>().ToTable("Users");
        base.OnModelCreating(modelBuilder);
    }
}
