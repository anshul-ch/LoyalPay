namespace LoyalPay.Shared.Events;

public record UserNotificationRequestedEvent(
    Guid UserId,
    string Category,
    string Title,
    string Message,
    DateTime CreatedAtUtc);
