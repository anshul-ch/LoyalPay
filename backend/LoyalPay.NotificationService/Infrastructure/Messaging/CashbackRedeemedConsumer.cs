using LoyalPay.NotificationService.Application.Interfaces;
using LoyalPay.Shared.Events;
using MassTransit;

namespace LoyalPay.NotificationService.Infrastructure.Messaging;

public class CashbackRedeemedConsumer : IConsumer<CashbackRedeemedEvent>
{
    private readonly INotificationService _notificationService;

    public CashbackRedeemedConsumer(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    public async Task Consume(ConsumeContext<CashbackRedeemedEvent> context)
    {
        await _notificationService.CreateAsync(
            context.Message.UserId,
            "Rewards",
            "Cashback credited",
            $"Cashback redemption '{context.Message.ItemName}' credited INR {context.Message.CashbackAmount:0.00} to your wallet.",
            DateTime.UtcNow);
    }
}
