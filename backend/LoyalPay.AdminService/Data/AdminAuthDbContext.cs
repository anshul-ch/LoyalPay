using LoyalPay.AdminService.Models;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.AdminService.Data;

public class AdminAuthDbContext : DbContext
{
    public AdminAuthDbContext(DbContextOptions<AdminAuthDbContext> options) : base(options)
    {
    }

    public DbSet<UserView> Users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserView>()
            .Property(u => u.CreatedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        base.OnModelCreating(modelBuilder);
    }
}
