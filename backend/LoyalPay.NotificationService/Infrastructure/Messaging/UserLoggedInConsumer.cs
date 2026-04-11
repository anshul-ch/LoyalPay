using LoyalPay.NotificationService.Application.Interfaces;
using LoyalPay.Shared.Events;
using MassTransit;

namespace LoyalPay.NotificationService.Infrastructure.Messaging;

public class UserLoggedInConsumer : IConsumer<UserLoggedInEvent>
{
    private readonly INotificationService _notificationService;

    public UserLoggedInConsumer(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    public async Task Consume(ConsumeContext<UserLoggedInEvent> context)
    {
        await _notificationService.CreateAsync(
            context.Message.UserId,
            "Security",
            "New login",
            $"A login was detected for your account on {context.Message.LoggedInAtUtc:yyyy-MM-dd HH:mm:ss} UTC.",
            context.Message.LoggedInAtUtc,
            context.Message.Email,
            context.Message.FullName);
    }
}
