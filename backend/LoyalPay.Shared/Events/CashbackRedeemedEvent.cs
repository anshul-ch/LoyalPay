namespace LoyalPay.Shared.Events;

public record CashbackRedeemedEvent(Guid UserId, Guid ItemId, string ItemName, decimal CashbackAmount);
