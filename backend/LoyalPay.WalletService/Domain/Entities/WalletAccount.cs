using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LoyalPay.WalletService.Domain.Entities;

[Table("WalletAccounts")]
public class WalletAccount
{
    [Key]
    public Guid WalletId { get; set; }

    public Guid UserId { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Balance { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
