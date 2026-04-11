using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LoyalPay.WalletService.Models;

[Table("TransferRequests")]
public class TransferRequest
{
    [Key]
    public Guid TransferId { get; set; }

    public Guid SenderWalletId { get; set; }

    public Guid ReceiverWalletId { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [MaxLength(500)]
    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; }
}
