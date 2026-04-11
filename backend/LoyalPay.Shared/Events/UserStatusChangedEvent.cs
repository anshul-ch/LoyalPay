namespace LoyalPay.Shared.Events;

public record UserStatusChangedEvent(
    Guid UserId,
    string Email,
    string FullName,
    bool IsActive,
    string? Reason,
    DateTime ChangedAtUtc);
