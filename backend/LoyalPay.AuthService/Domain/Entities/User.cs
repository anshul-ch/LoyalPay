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

    [Required]
    [MaxLength(50)]
    public string Role { get; set; } = "User";

    public bool IsActive { get; set; } = true;

    [Required]
    [MaxLength(50)]
    public string KycStatus { get; set; } = "Pending";

    [MaxLength(100)]
    public string? KycDocumentType { get; set; }

    [MaxLength(100)]
    public string? KycDocumentNumber { get; set; }

    public string? KycFilePath { get; set; }

    [MaxLength(500)]
    public string? KycRejectionNote { get; set; }

    public DateTime? KycReviewedAt { get; set; }

    public DateTime CreatedAt { get; set; }
}
