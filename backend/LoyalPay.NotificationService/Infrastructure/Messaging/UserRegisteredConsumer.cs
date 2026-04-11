using LoyalPay.NotificationService.Application.Interfaces;
using LoyalPay.Shared.Events;
using MassTransit;

namespace LoyalPay.NotificationService.Infrastructure.Messaging;

public class UserRegisteredConsumer : IConsumer<UserRegisteredEvent>
{
    private readonly INotificationService _notificationService;

    public UserRegisteredConsumer(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    public async Task Consume(ConsumeContext<UserRegisteredEvent> context)
    {
        await _notificationService.CreateAsync(
            context.Message.UserId,
            "Account",
            "Account successfully created",
            "Your LoyalPay account has been created successfully. Registered account details: user profile activated, wallet provisioning enabled, and rewards enrollment initialized.",
            DateTime.UtcNow,
            context.Message.Email,
            context.Message.FullName);
    }
}
