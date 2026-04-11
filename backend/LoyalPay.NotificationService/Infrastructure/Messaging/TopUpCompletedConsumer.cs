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
        await _notificationService.CreateAsync(
            context.Message.UserId,
            "Transaction",
            "Top-up successful",
            $"Your wallet top-up of INR {context.Message.Amount:0.00} via {context.Message.PaymentMethod} was successful.",
            DateTime.UtcNow);
    }
}
