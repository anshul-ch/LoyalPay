using System.ComponentModel.DataAnnotations;

namespace LoyalPay.AdminService.Application.DTOs;

public class CreateRewardDto
{
    [Required]
    [MinLength(3)]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    [RegularExpression("^(Cashback|Coupon|Voucher)$")]
    public string ItemType { get; set; } = "Coupon";

    [Range(50, 20000)]
    public int PointsCost { get; set; }

    public int Stock { get; set; } = -1;
}
