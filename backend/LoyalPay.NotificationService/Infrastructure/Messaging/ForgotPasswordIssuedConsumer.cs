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
            "Temporary password issued",
            $"A temporary password was generated for your account. Temporary password: {context.Message.TemporaryPassword}",
            context.Message.IssuedAtUtc,
            context.Message.Email,
            context.Message.FullName);
    }
}
