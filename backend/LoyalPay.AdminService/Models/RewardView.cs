using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LoyalPay.AdminService.Models;

[Table("RewardAccounts")]
public class RewardView
{
    [Key]
    public Guid RewardId { get; set; }

    public Guid UserId { get; set; }

    public int TotalPoints { get; set; }

    [MaxLength(50)]
    public string Tier { get; set; } = "Silver";
}
