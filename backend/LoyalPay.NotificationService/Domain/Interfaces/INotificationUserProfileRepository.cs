using LoyalPay.NotificationService.Domain.Entities;

namespace LoyalPay.NotificationService.Domain.Interfaces;

public interface INotificationUserProfileRepository
{
    Task<NotificationUserProfile?> GetByUserIdAsync(Guid userId);
    Task UpsertAsync(Guid userId, string? email, string? fullName);
    Task SaveChangesAsync();
}
