using LoyalPay.AdminService.Models;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.AdminService.Data;

public class AdminRewardsDbContext : DbContext
{
    public AdminRewardsDbContext(DbContextOptions<AdminRewardsDbContext> options) : base(options)
    {
    }

    public DbSet<RewardView> RewardAccounts { get; set; }
    public DbSet<Campaign> Campaigns { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<RewardView>()
            .ToTable("RewardAccounts", t => t.ExcludeFromMigrations());

        modelBuilder.Entity<Campaign>()
            .Property(c => c.CampaignId)
            .HasDefaultValueSql("NEWID()");

        modelBuilder.Entity<Campaign>()
            .Property(c => c.CreatedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        modelBuilder.Entity<AuditLog>()
            .Property(a => a.LogId)
            .HasDefaultValueSql("NEWID()");

        modelBuilder.Entity<AuditLog>()
            .Property(a => a.CreatedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        base.OnModelCreating(modelBuilder);
    }
}
