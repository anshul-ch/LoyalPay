using LoyalPay.NotificationService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.NotificationService.Infrastructure.Persistence.DbContext;

public class NotificationDbContext : Microsoft.EntityFrameworkCore.DbContext
{
    public NotificationDbContext(Microsoft.EntityFrameworkCore.DbContextOptions<NotificationDbContext> options) : base(options)
    {
    }

    public DbSet<UserNotification> UserNotifications { get; set; }
    public DbSet<NotificationUserProfile> NotificationUserProfiles { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserNotification>()
            .Property(x => x.NotificationId)
            .HasDefaultValueSql("NEWID()");

        modelBuilder.Entity<UserNotification>()
            .Property(x => x.CreatedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        modelBuilder.Entity<UserNotification>()
            .HasIndex(x => new { x.UserId, x.CreatedAt });

        modelBuilder.Entity<UserNotification>()
            .HasIndex(x => new { x.UserId, x.IsRead });

        modelBuilder.Entity<NotificationUserProfile>()
            .Property(x => x.UpdatedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        modelBuilder.Entity<NotificationUserProfile>()
            .HasIndex(x => x.Email);

        base.OnModelCreating(modelBuilder);
    }
}
