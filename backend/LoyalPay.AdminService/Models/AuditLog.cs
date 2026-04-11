using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LoyalPay.AdminService.Models;

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
