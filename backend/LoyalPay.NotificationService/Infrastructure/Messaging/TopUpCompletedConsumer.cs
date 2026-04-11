using LoyalPay.NotificationService.Application.Interfaces;
using LoyalPay.Shared.Events;
using MassTransit;

namespace LoyalPay.NotificationService.Infrastructure.Messaging;

public class TopUpCompletedConsumer : IConsumer<TopUpCompletedEvent>
{
    private readonly INotificationService _notificationService;

    public TopUpCompletedConsumer(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    public async Task Consume(ConsumeContext<TopUpCompletedEvent> context)
    {
        var msg = context.Message;
        var body = $"A top-up of INR {msg.Amount:0.00} has been credited to your wallet."
            + $"\n||Amount:INR {msg.Amount:0.00}"
            + $"\n||Payment Method:{msg.PaymentMethod}"
            + $"\n||Reference:{msg.TopUpId}"
            + $"\n||Date:{DateTime.UtcNow:dd MMM yyyy, HH:mm:ss} UTC";

        await _notificationService.CreateAsync(
            msg.UserId,
            "Transaction",
            "Wallet top-up completed",
            body,
            DateTime.UtcNow);
    }
}
