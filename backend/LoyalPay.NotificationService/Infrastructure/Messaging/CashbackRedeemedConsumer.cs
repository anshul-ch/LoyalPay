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
        var msg = context.Message;
        var body = $"A cashback reward of INR {msg.CashbackAmount:0.00} has been credited to your wallet."
            + $"\n||Item:{msg.ItemName}"
            + $"\n||Cashback Credited:INR {msg.CashbackAmount:0.00}"
            + $"\n||Date:{DateTime.UtcNow:dd MMM yyyy, HH:mm:ss} UTC";

        await _notificationService.CreateAsync(
            msg.UserId,
            "Rewards",
            "Cashback credited",
            body,
            DateTime.UtcNow);
    }
}
