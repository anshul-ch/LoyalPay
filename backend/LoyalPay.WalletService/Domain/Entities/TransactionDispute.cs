using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LoyalPay.WalletService.Domain.Entities;

[Table("TransactionDisputes")]
public class TransactionDispute
{
    [Key]
    public Guid DisputeId { get; set; }

    public Guid WalletId { get; set; }

    public Guid? LedgerEntryId { get; set; }

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Open";

    [Required]
    [MaxLength(500)]
    public string Reason { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime? ResolvedAt { get; set; }
}
