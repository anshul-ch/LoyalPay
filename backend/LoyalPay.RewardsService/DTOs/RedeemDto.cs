using System.ComponentModel.DataAnnotations;

namespace LoyalPay.RewardsService.DTOs;

public class RedeemDto
{
    [Required]
    public Guid ItemId { get; set; }
}
