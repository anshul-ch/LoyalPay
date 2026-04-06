using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LoyalPay.AdminService.Domain.Entities;

[Table("WalletAccounts")]
public class WalletView
{
    [Key]
    public Guid WalletId { get; set; }

    public Guid UserId { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Balance { get; set; }
}
