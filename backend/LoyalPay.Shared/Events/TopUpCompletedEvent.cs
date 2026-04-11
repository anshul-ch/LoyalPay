namespace LoyalPay.Shared.Events;

public record TopUpCompletedEvent(Guid UserId, decimal Amount, Guid TopUpId, string PaymentMethod);
