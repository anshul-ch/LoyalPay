using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LoyalPay.RewardsService.Models;

[Table("Redemptions")]
public class Redemption
{
    [Key]
    public Guid RedemptionId { get; set; }

    public Guid UserId { get; set; }

    public Guid ItemId { get; set; }

    public int PointsSpent { get; set; }

    [MaxLength(200)]
    public string? CouponCode { get; set; }

    public DateTime CreatedAt { get; set; }
}
