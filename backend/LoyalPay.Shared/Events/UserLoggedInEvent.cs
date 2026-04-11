namespace LoyalPay.Shared.Events;

public record UserLoggedInEvent(Guid UserId, string Email, string FullName, DateTime LoggedInAtUtc);
