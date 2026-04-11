namespace LoyalPay.Shared.Events;
public record UserRegisteredEvent(Guid UserId, string Email, string FullName);
