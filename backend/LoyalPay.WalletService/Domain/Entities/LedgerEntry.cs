using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LoyalPay.WalletService.Domain.Entities;

[Table("LedgerEntries")]
public class LedgerEntry
{
    [Key]
    public Guid EntryId { get; set; }

    public Guid WalletId { get; set; }

    [MaxLength(20)]
    public string EntryType { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal BalanceAfter { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; }
}
