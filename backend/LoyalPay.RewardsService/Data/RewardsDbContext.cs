using LoyalPay.RewardsService.Models;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.RewardsService.Data;

public class RewardsDbContext : DbContext
{
    public RewardsDbContext(DbContextOptions<RewardsDbContext> options) : base(options)
    {
    }

    public DbSet<RewardAccount> RewardAccounts { get; set; }
    public DbSet<RewardTransaction> RewardTransactions { get; set; }
    public DbSet<CatalogItem> CatalogItems { get; set; }
    public DbSet<Redemption> Redemptions { get; set; }

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

        base.OnModelCreating(modelBuilder);
    }
}
