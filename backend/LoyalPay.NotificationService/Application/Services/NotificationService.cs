using LoyalPay.NotificationService.Application.DTOs;
using LoyalPay.NotificationService.Application.Interfaces;
using LoyalPay.NotificationService.Domain.Entities;
using LoyalPay.NotificationService.Domain.Interfaces;
using LoyalPay.Shared.Common;

namespace LoyalPay.NotificationService.Application.Services;

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _notificationRepository;
    private readonly INotificationUserProfileRepository _userProfileRepository;
    private readonly IEmailSender _emailSender;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        INotificationRepository notificationRepository,
        INotificationUserProfileRepository userProfileRepository,
        IEmailSender emailSender,
        ILogger<NotificationService> logger)
    {
        _notificationRepository = notificationRepository;
        _userProfileRepository = userProfileRepository;
        _emailSender = emailSender;
        _logger = logger;
    }

    public async Task<ApiResponse<string>> CreateAsync(
        Guid userId,
        string category,
        string title,
        string message,
        DateTime createdAtUtc,
        string? userEmail = null,
        string? userFullName = null)
    {
        if (userId == Guid.Empty)
        {
            return ApiResponse<string>.Fail("Invalid user ID.");
        }

        if (!string.IsNullOrWhiteSpace(userEmail) || !string.IsNullOrWhiteSpace(userFullName))
        {
            await _userProfileRepository.UpsertAsync(userId, userEmail, userFullName);
            await _userProfileRepository.SaveChangesAsync();
        }

        var notification = new UserNotification
        {
            UserId = userId,
            Category = category,
            Title = title,
            Message = message,
            IsRead = false,
            CreatedAt = createdAtUtc == default ? DateTime.UtcNow : createdAtUtc
        };

        await _notificationRepository.AddAsync(notification);
        await _notificationRepository.SaveChangesAsync();

        try
        {
            var profile = await _userProfileRepository.GetByUserIdAsync(userId);
            if (!string.IsNullOrWhiteSpace(profile?.Email))
            {
                var emailSubject = BuildEmailSubject(category, title);
                await _emailSender.SendAsync(profile.Email, profile.FullName, emailSubject, message);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send notification email for user {UserId}", userId);
        }

        return ApiResponse<string>.Ok("Notification queued successfully.");
    }

    public async Task<ApiResponse<object>> GetMyNotificationsAsync(Guid userId, int page, int size)
    {
        if (page < 1)
        {
            page = 1;
        }

        if (size < 1)
        {
            size = 20;
        }

        var notifications = await _notificationRepository.GetByUserIdAsync(userId, page, size);
        var unreadCount = await _notificationRepository.GetUnreadCountAsync(userId);

        var items = notifications.Select(n => new NotificationDto
        {
            NotificationId = n.NotificationId,
            Category = n.Category,
            Title = n.Title,
            Message = n.Message,
            IsRead = n.IsRead,
            CreatedAt = n.CreatedAt,
            ReadAt = n.ReadAt
        }).ToList();

        return ApiResponse<object>.Ok(new
        {
            Items = items,
            Page = page,
            Size = size,
            UnreadCount = unreadCount
        });
    }

    public async Task<ApiResponse<string>> MarkAsReadAsync(Guid userId, Guid notificationId)
    {
        var notification = await _notificationRepository.GetByIdAsync(notificationId);
        if (notification == null || notification.UserId != userId)
        {
            return ApiResponse<string>.Fail("Notification not found.");
        }

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await _notificationRepository.SaveChangesAsync();
        }

        return ApiResponse<string>.Ok("Notification marked as read.");
    }

    private static string BuildEmailSubject(string? category, string? title)
    {
        var cleanTitle = string.IsNullOrWhiteSpace(title)
            ? "Notification"
            : title.Trim();

        var combined = $"{category} {cleanTitle}".ToLowerInvariant();

        if (combined.Contains("temporary password")
            || combined.Contains("password reset")
            || combined.Contains("forgot password"))
        {
            return "LoyalPay Security: Temporary Password";
        }

        if (combined.Contains("sign-in")
            || combined.Contains("sign in")
            || combined.Contains("login")
            || combined.Contains("logged in"))
        {
            return "LoyalPay Security: Sign-In Alert";
        }

        if (combined.Contains("transaction")
            || combined.Contains("transfer")
            || combined.Contains("top-up")
            || combined.Contains("wallet")
            || combined.Contains("payment"))
        {
            return "LoyalPay Payments: Transaction Update";
        }

        if (combined.Contains("account") && combined.Contains("created"))
        {
            return "LoyalPay Account: Successfully Created";
        }

        if (combined.Contains("inactive"))
        {
            return "LoyalPay Account: Marked Inactive";
        }

        if (combined.Contains("reactivated") || combined.Contains("active"))
        {
            return "LoyalPay Account: Reactivated";
        }

        return $"LoyalPay Alert: {cleanTitle}";
    }
}
