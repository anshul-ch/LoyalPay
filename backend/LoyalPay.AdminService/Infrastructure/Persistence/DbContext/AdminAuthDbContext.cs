using LoyalPay.AdminService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.AdminService.Infrastructure.Persistence.DbContext;

public class AdminAuthDbContext : Microsoft.EntityFrameworkCore.DbContext
{
    public AdminAuthDbContext(Microsoft.EntityFrameworkCore.DbContextOptions<AdminAuthDbContext> options) : base(options)
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
