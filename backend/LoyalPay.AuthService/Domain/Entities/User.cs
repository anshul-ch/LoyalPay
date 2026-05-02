using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LoyalPay.AuthService.Domain.Entities;

[Table("Users")]
public class User
{
    [Key]
    public Guid UserId { get; set; }

    [Required]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    public bool MustChangePassword { get; set; } = false;

    [Required]
    [MaxLength(50)]
    public string Role { get; set; } = "User";

    public bool IsActive { get; set; } = true;

    [MaxLength(500)]
    public string? InactiveReason { get; set; }

    [Required]
    [MaxLength(50)]
    public string KycStatus { get; set; } = "NotSubmitted";

    [MaxLength(100)]
    public string? KycDocumentType { get; set; }

    [MaxLength(100)]
    public string? KycDocumentNumber { get; set; }

    [MaxLength(500)]
    public string? KycRejectionNote { get; set; }

    public DateTime? KycReviewedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// BCrypt-hashed 5-digit transaction PIN. Null until the user sets one.
    /// Once set, can only be reset by a Support agent after a valid PIN-reset ticket.
    /// </summary>
    [MaxLength(100)]
    public string? TransactionPinHash { get; set; }
}
