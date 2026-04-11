using LoyalPay.NotificationService.Application.Interfaces;
using LoyalPay.Shared.Events;
using MassTransit;

namespace LoyalPay.NotificationService.Infrastructure.Messaging;

public class UserNotificationRequestedConsumer : IConsumer<UserNotificationRequestedEvent>
{
    private readonly INotificationService _notificationService;

    public UserNotificationRequestedConsumer(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    public async Task Consume(ConsumeContext<UserNotificationRequestedEvent> context)
    {
        await _notificationService.CreateAsync(
            context.Message.UserId,
            context.Message.Category,
            context.Message.Title,
            context.Message.Message,
            context.Message.CreatedAtUtc);
    }
}
