namespace LoyalPay.Shared.Events;

public record SupportTicketUpdatedEvent(
    Guid TicketId,
    string TicketNumber,
    Guid UserId,
    string UserEmail,
    string UserFullName,
    string Category,
    string Subject,
    string NewStatus,
    string? Resolution,
    Guid? AssignedToUserId,
    DateTime UpdatedAtUtc);
