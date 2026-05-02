using LoyalPay.NotificationService.Application.Interfaces;
using LoyalPay.Shared.Events;
using MassTransit;

namespace LoyalPay.NotificationService.Infrastructure.Messaging;

public class SupportTicketUpdatedConsumer : IConsumer<SupportTicketUpdatedEvent>
{
    private readonly INotificationService _notificationService;

    public SupportTicketUpdatedConsumer(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    public async Task Consume(ConsumeContext<SupportTicketUpdatedEvent> context)
    {
        var msg = context.Message;

        var resolution = string.IsNullOrWhiteSpace(msg.Resolution)
            ? "Our team has reviewed your case and it has been marked as resolved."
            : msg.Resolution;

        var emailBody = $"""
Your support ticket {msg.TicketNumber} has been resolved.

Category: {msg.Category}
Subject: {msg.Subject}
Resolution: {resolution}

Next Steps:
- If you are satisfied with the resolution, no further action is needed.
- If the issue persists, please open a new support ticket referencing {msg.TicketNumber}.
- For urgent matters, contact your nearest branch.

Thank you for using LoyalPay.
""";

        await _notificationService.CreateAsync(
            msg.UserId,
            "Support",
            $"Ticket {msg.TicketNumber} Resolved",
            emailBody,
            msg.UpdatedAtUtc,
            msg.UserEmail,
            msg.UserFullName);
    }
}
