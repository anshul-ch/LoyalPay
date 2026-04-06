using System.ComponentModel.DataAnnotations;

namespace LoyalPay.RewardsService.Application.DTOs;

public class RedeemDto
{
    [Required]
    public Guid ItemId { get; set; }
}
