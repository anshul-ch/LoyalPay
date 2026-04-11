namespace LoyalPay.Shared.Events;

public record ForgotPasswordIssuedEvent(
    Guid UserId,
    string Email,
    string FullName,
    string TemporaryPassword,
    DateTime IssuedAtUtc);
