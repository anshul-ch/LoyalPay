using LoyalPay.NotificationService.Application.Interfaces;
using LoyalPay.Shared.Events;
using MassTransit;

namespace LoyalPay.NotificationService.Infrastructure.Messaging;

public class ForgotPasswordIssuedConsumer : IConsumer<ForgotPasswordIssuedEvent>
{
    private readonly INotificationService _notificationService;

    public ForgotPasswordIssuedConsumer(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    public async Task Consume(ConsumeContext<ForgotPasswordIssuedEvent> context)
    {
        await _notificationService.CreateAsync(
            context.Message.UserId,
            "Security",
            "Temporary password generated",
            $"A temporary password reset request was processed for your account on {context.Message.IssuedAtUtc:yyyy-MM-dd HH:mm:ss} UTC. Temporary password: {context.Message.TemporaryPassword}. For security, sign in immediately and replace this password.",
            context.Message.IssuedAtUtc,
            context.Message.Email,
            context.Message.FullName);
    }
}
