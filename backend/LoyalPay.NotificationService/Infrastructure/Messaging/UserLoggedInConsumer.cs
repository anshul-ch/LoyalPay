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
        var msg = context.Message;

        var details = new System.Text.StringBuilder();
        details.Append($"A successful sign-in to your LoyalPay account was recorded on {msg.LoggedInAtUtc:dd MMM yyyy} at {msg.LoggedInAtUtc:HH:mm:ss} UTC.");
        details.Append($"\n||Date:{msg.LoggedInAtUtc:dd MMM yyyy, HH:mm:ss} UTC");
        if (!string.IsNullOrWhiteSpace(msg.Browser))
            details.Append($"\n||Browser:{msg.Browser}");
        if (!string.IsNullOrWhiteSpace(msg.OperatingSystem))
            details.Append($"\n||Operating System:{msg.OperatingSystem}");
        details.Append($"\n||Account:{msg.FullName}");

        await _notificationService.CreateAsync(
            msg.UserId,
            "Security",
            "New sign-in detected",
            details.ToString(),
            msg.LoggedInAtUtc,
            msg.Email,
            msg.FullName);
    }
}
