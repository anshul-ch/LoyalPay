using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LoyalPay.AdminService.Domain.Entities;

// Read-only view of the KycSubmissions table owned by AuthService.
[Table("KycSubmissions")]
public class KycSubmissionView
{
    [Key]
    public Guid SubmissionId { get; set; }

    public Guid UserId { get; set; }

    [MaxLength(100)]
    public string DocumentType { get; set; } = string.Empty;

    [MaxLength(100)]
    public string DocumentNumber { get; set; } = string.Empty;

    public byte[] FileData { get; set; } = Array.Empty<byte>();

    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string ContentType { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Status { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? RejectionNote { get; set; }

    public DateTime SubmittedAt { get; set; }

    public DateTime? ReviewedAt { get; set; }
}
