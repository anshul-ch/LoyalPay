using LoyalPay.NotificationService.Domain.Entities;
using LoyalPay.NotificationService.Domain.Interfaces;
using LoyalPay.NotificationService.Infrastructure.Persistence.DbContext;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.NotificationService.Infrastructure.Persistence.Repositories;

public class NotificationUserProfileRepository : INotificationUserProfileRepository
{
    private readonly NotificationDbContext _db;

    public NotificationUserProfileRepository(NotificationDbContext db)
    {
        _db = db;
    }

    public async Task<NotificationUserProfile?> GetByUserIdAsync(Guid userId)
    {
        return await _db.NotificationUserProfiles.FirstOrDefaultAsync(x => x.UserId == userId);
    }

    public async Task UpsertAsync(Guid userId, string? email, string? fullName)
    {
        var row = await _db.NotificationUserProfiles.FirstOrDefaultAsync(x => x.UserId == userId);
        if (row == null)
        {
            row = new NotificationUserProfile
            {
                UserId = userId,
                Email = email,
                FullName = fullName,
                UpdatedAt = DateTime.UtcNow
            };

            _db.NotificationUserProfiles.Add(row);
            return;
        }

        row.Email = email;
        row.FullName = fullName;
        row.UpdatedAt = DateTime.UtcNow;
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}
