using LoyalPay.NotificationService.Application.Interfaces;
using LoyalPay.Shared.Events;
using MassTransit;

namespace LoyalPay.NotificationService.Infrastructure.Messaging;

public class UserStatusChangedConsumer : IConsumer<UserStatusChangedEvent>
{
    private readonly INotificationService _notificationService;

    public UserStatusChangedConsumer(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    public async Task Consume(ConsumeContext<UserStatusChangedEvent> context)
    {
        if (context.Message.IsActive)
        {
            await _notificationService.CreateAsync(
                context.Message.UserId,
                "Account",
                "Account reactivated",
                $"Your LoyalPay account status has been updated to Active on {context.Message.ChangedAtUtc:yyyy-MM-dd HH:mm:ss} UTC. Access to all account services has been restored.",
                context.Message.ChangedAtUtc,
                context.Message.Email,
                context.Message.FullName);

            return;
        }

        var reasonSegment = string.IsNullOrWhiteSpace(context.Message.Reason)
            ? ""
            : $" Reason: {context.Message.Reason}";

        await _notificationService.CreateAsync(
            context.Message.UserId,
            "Account",
            "Account marked inactive",
            $"Your LoyalPay account status has been updated to Inactive on {context.Message.ChangedAtUtc:yyyy-MM-dd HH:mm:ss} UTC by our compliance team.{reasonSegment} Access to account operations may be restricted until review completion.",
            context.Message.ChangedAtUtc,
            context.Message.Email,
            context.Message.FullName);
    }
}
