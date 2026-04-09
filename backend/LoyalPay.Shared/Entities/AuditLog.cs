using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LoyalPay.Shared.Entities;

/// <summary>
/// Immutable admin action record written to the Rewards database.
/// Shared between AdminService (writes) and RewardsService (owns the table).
/// </summary>
[Table("AuditLogs")]
public class AuditLog
{
    [Key]
    public Guid LogId { get; set; }

    public Guid AdminUserId { get; set; }

    [MaxLength(200)]
    public string Action { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }
}
