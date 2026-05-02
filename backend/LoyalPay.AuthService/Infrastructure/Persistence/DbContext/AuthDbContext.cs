using LoyalPay.AuthService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.AuthService.Infrastructure.Persistence.DbContext;

public class AuthDbContext : Microsoft.EntityFrameworkCore.DbContext
{
    public AuthDbContext(Microsoft.EntityFrameworkCore.DbContextOptions<AuthDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<KycSubmission> KycSubmissions { get; set; }
    public DbSet<SupportTicket> SupportTickets { get; set; }

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

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Phone)
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

        // FileData stored as varbinary(max) — no size limit annotation needed here.
        modelBuilder.Entity<KycSubmission>()
            .Property(x => x.FileData)
            .HasColumnType("varbinary(max)");

        modelBuilder.Entity<KycSubmission>()
            .HasIndex(x => x.UserId);

        // SupportTicket configuration
        modelBuilder.Entity<SupportTicket>()
            .Property(x => x.TicketId)
            .HasDefaultValueSql("NEWID()");

        modelBuilder.Entity<SupportTicket>()
            .Property(x => x.CreatedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        modelBuilder.Entity<SupportTicket>()
            .Property(x => x.UpdatedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        modelBuilder.Entity<SupportTicket>()
            .HasIndex(x => x.UserId);

        modelBuilder.Entity<SupportTicket>()
            .HasIndex(x => x.Status);

        modelBuilder.Entity<SupportTicket>()
            .HasIndex(x => x.TicketNumber)
            .IsUnique();

        modelBuilder.Entity<SupportTicket>()
            .HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        base.OnModelCreating(modelBuilder);
    }
}
