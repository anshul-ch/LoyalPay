using LoyalPay.NotificationService.Domain.Entities;
using LoyalPay.NotificationService.Domain.Interfaces;
using LoyalPay.NotificationService.Infrastructure.Persistence.DbContext;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.NotificationService.Infrastructure.Persistence.Repositories;

public class NotificationRepository : INotificationRepository
{
    private readonly NotificationDbContext _db;

    public NotificationRepository(NotificationDbContext db)
    {
        _db = db;
    }

    public async Task AddAsync(UserNotification notification)
    {
        _db.UserNotifications.Add(notification);
        await Task.CompletedTask;
    }

    public async Task<UserNotification?> GetByIdAsync(Guid notificationId)
    {
        return await _db.UserNotifications.FirstOrDefaultAsync(n => n.NotificationId == notificationId);
    }

    public async Task<List<UserNotification>> GetByUserIdAsync(Guid userId, int page, int size)
    {
        return await _db.UserNotifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * size)
            .Take(size)
            .ToListAsync();
    }

    public async Task<int> GetUnreadCountAsync(Guid userId)
    {
        return await _db.UserNotifications.CountAsync(n => n.UserId == userId && !n.IsRead);
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}
