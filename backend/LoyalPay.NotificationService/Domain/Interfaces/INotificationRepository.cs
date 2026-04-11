using LoyalPay.NotificationService.Domain.Entities;

namespace LoyalPay.NotificationService.Domain.Interfaces;

public interface INotificationRepository
{
    Task AddAsync(UserNotification notification);
    Task<UserNotification?> GetByIdAsync(Guid notificationId);
    Task<List<UserNotification>> GetByUserIdAsync(Guid userId, int page, int size);
    Task<int> GetUnreadCountAsync(Guid userId);
    Task SaveChangesAsync();
}
