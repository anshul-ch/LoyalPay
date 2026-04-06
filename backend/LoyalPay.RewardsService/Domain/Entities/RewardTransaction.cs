using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LoyalPay.RewardsService.Domain.Entities;

[Table("RewardTransactions")]
public class RewardTransaction
{
    [Key]
    public Guid TxnId { get; set; }

    public Guid UserId { get; set; }

    [MaxLength(20)]
    public string TxnType { get; set; } = string.Empty;

    public int Points { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; }
}
