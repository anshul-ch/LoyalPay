namespace LoyalPay.Shared.Events;

public record CashbackRedeemedEvent(Guid UserId, Guid RedemptionId, Guid ItemId, string ItemName, decimal CashbackAmount);
