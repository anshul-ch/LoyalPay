namespace LoyalPay.Shared.Events;

public record TransferCompletedEvent(Guid TransferId, Guid SenderUserId, Guid ReceiverUserId, decimal Amount);
