using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LoyalPay.WalletService.Domain.Entities;

[Table("Users")]
public class UserVerificationView
{
    [Key]
    public Guid UserId { get; set; }

    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    public bool IsActive { get; set; }

    [MaxLength(50)]
    public string KycStatus { get; set; } = string.Empty;
}
