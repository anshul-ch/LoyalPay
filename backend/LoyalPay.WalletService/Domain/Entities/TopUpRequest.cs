using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LoyalPay.WalletService.Domain.Entities;

[Table("TopUpRequests")]
public class TopUpRequest
{
    [Key]
    public Guid TopUpId { get; set; }

    public Guid WalletId { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [MaxLength(100)]
    public string PaymentMethod { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Status { get; set; } = "Pending";

    public DateTime CreatedAt { get; set; }

    public WalletAccount WalletAccount { get; set; } = null!;
}
