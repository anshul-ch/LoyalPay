using LoyalPay.AdminService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.AdminService.Infrastructure.Persistence.DbContext;

public class AdminAuthDbContext : Microsoft.EntityFrameworkCore.DbContext
{
    public AdminAuthDbContext(Microsoft.EntityFrameworkCore.DbContextOptions<AdminAuthDbContext> options) : base(options)
    {
    }

    public DbSet<UserView> Users { get; set; }

    /// <summary>
    /// Read-only view of KYC submissions owned by AuthService.
    /// AdminService never writes to this table.
    /// </summary>
    public DbSet<KycSubmissionView> KycSubmissions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserView>()
            .Property(u => u.CreatedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        // Exclude from migrations — this table is owned by AuthService.
        modelBuilder.Entity<KycSubmissionView>()
            .ToTable("KycSubmissions", t => t.ExcludeFromMigrations());

        modelBuilder.Entity<KycSubmissionView>()
            .Property(k => k.FileData)
            .HasColumnType("varbinary(max)");

        base.OnModelCreating(modelBuilder);
    }
}
