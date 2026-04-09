using LoyalPay.RewardsService.Domain.Entities;
using LoyalPay.Shared.Entities;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.RewardsService.Infrastructure.Persistence.DbContext;

public class RewardsDbContext : Microsoft.EntityFrameworkCore.DbContext
{
    public RewardsDbContext(Microsoft.EntityFrameworkCore.DbContextOptions<RewardsDbContext> options) : base(options)
    {
    }

    public DbSet<RewardAccount> RewardAccounts { get; set; }
    public DbSet<RewardTransaction> RewardTransactions { get; set; }
    public DbSet<CatalogItem> CatalogItems { get; set; }
    public DbSet<Redemption> Redemptions { get; set; }
    public DbSet<PointExpiry> PointExpiries { get; set; }

    public DbSet<Campaign> Campaigns { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<RewardAccount>().Property(x => x.RewardId).HasDefaultValueSql("NEWID()");
        modelBuilder.Entity<RewardAccount>().Property(x => x.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        modelBuilder.Entity<RewardAccount>().Property(x => x.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
        modelBuilder.Entity<RewardAccount>().HasIndex(x => x.UserId).IsUnique();

        modelBuilder.Entity<RewardTransaction>().Property(x => x.TxnId).HasDefaultValueSql("NEWID()");
        modelBuilder.Entity<RewardTransaction>().Property(x => x.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        modelBuilder.Entity<CatalogItem>().Property(x => x.ItemId).HasDefaultValueSql("NEWID()");
        modelBuilder.Entity<CatalogItem>().Property(x => x.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        modelBuilder.Entity<Redemption>().Property(x => x.RedemptionId).HasDefaultValueSql("NEWID()");
        modelBuilder.Entity<Redemption>().Property(x => x.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        modelBuilder.Entity<PointExpiry>().Property(x => x.ExpiryId).HasDefaultValueSql("NEWID()");
        modelBuilder.Entity<PointExpiry>().HasIndex(x => new { x.UserId, x.ExpiresAt });

        modelBuilder.Entity<Campaign>().ToTable("Campaigns", t => t.ExcludeFromMigrations());
        modelBuilder.Entity<Campaign>().Property(x => x.CampaignId).HasDefaultValueSql("NEWID()");
        modelBuilder.Entity<Campaign>().Property(x => x.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        base.OnModelCreating(modelBuilder);
    }
}
