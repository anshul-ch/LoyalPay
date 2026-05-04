namespace LoyalPay.Shared.Events;

public record UserActivatedEvent(
    Guid UserId,
    string Email,
    string FullName,
    DateTime ActivatedAtUtc);

public record UserDeactivatedEvent(
    Guid UserId,
    string Email,
    string FullName,
    string? Reason,
    DateTime DeactivatedAtUtc);
