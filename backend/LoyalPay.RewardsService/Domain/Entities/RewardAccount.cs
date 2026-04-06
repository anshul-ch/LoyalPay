using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LoyalPay.RewardsService.Domain.Entities;

[Table("RewardAccounts")]
public class RewardAccount
{
    [Key]
    public Guid RewardId { get; set; }

    public Guid UserId { get; set; }

    public int TotalPoints { get; set; }

    [MaxLength(50)]
    public string Tier { get; set; } = "Silver";

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
