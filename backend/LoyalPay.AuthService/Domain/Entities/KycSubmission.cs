using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LoyalPay.AuthService.Domain.Entities;

[Table("KycSubmissions")]
public class KycSubmission
{
    [Key]
    public Guid SubmissionId { get; set; }

    public Guid UserId { get; set; }

    [Required]
    [MaxLength(100)]
    public string DocumentType { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string DocumentNumber { get; set; } = string.Empty;

    public string FilePath { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Pending";

    [MaxLength(500)]
    public string? RejectionNote { get; set; }

    public DateTime SubmittedAt { get; set; }

    public DateTime? ReviewedAt { get; set; }
}
