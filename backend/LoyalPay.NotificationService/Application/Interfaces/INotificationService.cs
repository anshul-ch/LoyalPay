using LoyalPay.NotificationService.Application.DTOs;
using LoyalPay.Shared.Common;

namespace LoyalPay.NotificationService.Application.Interfaces;

public interface INotificationService
{
    Task<ApiResponse<string>> CreateAsync(
        Guid userId,
        string category,
        string title,
        string message,
        DateTime createdAtUtc,
        string? userEmail = null,
        string? userFullName = null);
    Task<ApiResponse<object>> GetMyNotificationsAsync(Guid userId, int page, int size);
    Task<ApiResponse<string>> MarkAsReadAsync(Guid userId, Guid notificationId);
}
