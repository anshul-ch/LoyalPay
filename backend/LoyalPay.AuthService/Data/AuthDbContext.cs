using LoyalPay.AuthService.Models;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.AuthService.Data;

public class AuthDbContext : DbContext
{
    public AuthDbContext(DbContextOptions<AuthDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<KycSubmission> KycSubmissions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .Property(u => u.UserId)
            .HasDefaultValueSql("NEWID()");

        modelBuilder.Entity<User>()
            .Property(u => u.CreatedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<RefreshToken>()
            .Property(rt => rt.CreatedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        modelBuilder.Entity<RefreshToken>()
            .HasOne(rt => rt.User)
            .WithMany()
            .HasForeignKey(rt => rt.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<KycSubmission>()
            .Property(x => x.SubmissionId)
            .HasDefaultValueSql("NEWID()");

        modelBuilder.Entity<KycSubmission>()
            .Property(x => x.SubmittedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        modelBuilder.Entity<KycSubmission>()
            .HasIndex(x => x.UserId);

        base.OnModelCreating(modelBuilder);
    }
}
