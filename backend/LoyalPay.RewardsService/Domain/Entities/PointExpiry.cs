using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LoyalPay.RewardsService.Domain.Entities;

[Table("PointExpiries")]
public class PointExpiry
{
    [Key]
    public Guid ExpiryId { get; set; }

    public Guid UserId { get; set; }

    public int Points { get; set; }

    public DateTime EarnedAt { get; set; }

    public DateTime ExpiresAt { get; set; }

    public bool IsExpired { get; set; }
}
