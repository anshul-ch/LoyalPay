using LoyalPay.NotificationService.Application.Interfaces;
using LoyalPay.Shared.Events;
using MassTransit;

namespace LoyalPay.NotificationService.Infrastructure.Messaging;

public class TransferCompletedConsumer : IConsumer<TransferCompletedEvent>
{
    private readonly INotificationService _notificationService;

    public TransferCompletedConsumer(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    public async Task Consume(ConsumeContext<TransferCompletedEvent> context)
    {
        var noteSuffix = string.IsNullOrWhiteSpace(context.Message.Note)
            ? string.Empty
            : $" Note: {context.Message.Note}";

        await _notificationService.CreateAsync(
            context.Message.SenderUserId,
            "Transaction",
            "Transfer sent",
            $"You sent INR {context.Message.Amount:0.00} to another wallet.{noteSuffix}",
            DateTime.UtcNow);

        await _notificationService.CreateAsync(
            context.Message.ReceiverUserId,
            "Transaction",
            "Transfer received",
            $"You received INR {context.Message.Amount:0.00} from another wallet.{noteSuffix}",
            DateTime.UtcNow);
    }
}
