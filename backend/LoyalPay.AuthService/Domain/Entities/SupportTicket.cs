using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LoyalPay.AuthService.Domain.Entities;

/// <summary>
/// A customer support ticket raised by a user.
/// Visible to both Admin and Support agents.
/// </summary>
[Table("SupportTickets")]
public class SupportTicket
{
    [Key]
    public Guid TicketId { get; set; }

    /// <summary>Human-readable ticket number, e.g. LP-00001.</summary>
    [Required]
    [MaxLength(20)]
    public string TicketNumber { get; set; } = string.Empty;

    [Required]
    public Guid UserId { get; set; }

    /// <summary>
    /// Category of the issue.
    /// Allowed: PaymentIssue, KycProblem, AccountAccess, Rewards, TransactionDispute, PinReset, Other
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Category { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Subject { get; set; } = string.Empty;

    [Required]
    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    /// <summary>Open, InProgress, Resolved, Closed</summary>
    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Open";

    /// <summary>Low, Medium, High — auto-assigned based on category.</summary>
    [Required]
    [MaxLength(10)]
    public string Priority { get; set; } = "Medium";

    /// <summary>UserId of the Support agent this ticket is assigned to. Null = unassigned.</summary>
    public Guid? AssignedToUserId { get; set; }

    [MaxLength(2000)]
    public string? Resolution { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public DateTime? ResolvedAt { get; set; }

    // Navigation property
    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }
}
