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
        var msg = context.Message;
        var senderLabel = string.IsNullOrWhiteSpace(msg.SenderName) ? "—" : msg.SenderName;
        var receiverLabel = string.IsNullOrWhiteSpace(msg.ReceiverName) ? "—" : msg.ReceiverName;
        var noteRow = string.IsNullOrWhiteSpace(msg.Note) ? "" : $"\n||Note:{msg.Note}";

        var senderBody = $"A debit of INR {msg.Amount:0.00} has been processed from your wallet."
            + $"\n||Amount:INR {msg.Amount:0.00}"
            + $"\n||To:{receiverLabel}"
            + $"\n||Reference:{msg.TransferId}"
            + $"\n||Date:{DateTime.UtcNow:dd MMM yyyy, HH:mm:ss} UTC"
            + noteRow;

        var receiverBody = $"A credit of INR {msg.Amount:0.00} has been posted to your wallet."
            + $"\n||Amount:INR {msg.Amount:0.00}"
            + $"\n||From:{senderLabel}"
            + $"\n||Reference:{msg.TransferId}"
            + $"\n||Date:{DateTime.UtcNow:dd MMM yyyy, HH:mm:ss} UTC"
            + noteRow;

        await _notificationService.CreateAsync(
            msg.SenderUserId,
            "Transaction",
            "Transfer sent",
            senderBody,
            DateTime.UtcNow);

        await _notificationService.CreateAsync(
            msg.ReceiverUserId,
            "Transaction",
            "Transfer received",
            receiverBody,
            DateTime.UtcNow);
    }
}
