using LoyalPay.WalletService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.WalletService.Infrastructure.Persistence.DbContext;

public class WalletDbContext : Microsoft.EntityFrameworkCore.DbContext
{
    public WalletDbContext(Microsoft.EntityFrameworkCore.DbContextOptions<WalletDbContext> options) : base(options)
    {
    }

    public DbSet<WalletAccount> WalletAccounts { get; set; }
    public DbSet<LedgerEntry> LedgerEntries { get; set; }
    public DbSet<TopUpRequest> TopUpRequests { get; set; }
    public DbSet<TransferRequest> TransferRequests { get; set; }
    public DbSet<TransactionDispute> TransactionDisputes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<WalletAccount>()
            .Property(x => x.WalletId)
            .HasDefaultValueSql("NEWID()");

        modelBuilder.Entity<WalletAccount>()
            .Property(x => x.CreatedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        modelBuilder.Entity<WalletAccount>()
            .Property(x => x.UpdatedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        modelBuilder.Entity<WalletAccount>()
            .HasIndex(x => x.UserId)
            .IsUnique();

        modelBuilder.Entity<LedgerEntry>()
            .Property(x => x.EntryId)
            .HasDefaultValueSql("NEWID()");

        modelBuilder.Entity<LedgerEntry>()
            .Property(x => x.CreatedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        modelBuilder.Entity<TopUpRequest>()
            .Property(x => x.TopUpId)
            .HasDefaultValueSql("NEWID()");

        modelBuilder.Entity<TopUpRequest>()
            .Property(x => x.CreatedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        modelBuilder.Entity<TopUpRequest>()
            .HasOne(x => x.WalletAccount)
            .WithMany()
            .HasForeignKey(x => x.WalletId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TransferRequest>()
            .Property(x => x.TransferId)
            .HasDefaultValueSql("NEWID()");

        modelBuilder.Entity<TransferRequest>()
            .Property(x => x.CreatedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        modelBuilder.Entity<TransactionDispute>()
            .Property(x => x.DisputeId)
            .HasDefaultValueSql("NEWID()");

        modelBuilder.Entity<TransactionDispute>()
            .Property(x => x.CreatedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        modelBuilder.Entity<TransactionDispute>()
            .HasIndex(x => x.WalletId);

        base.OnModelCreating(modelBuilder);
    }
}
