using System.ComponentModel.DataAnnotations;

namespace LoyalPay.AdminService.DTOs;

public class CampaignDto
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required]
    [Range(1, 10000)]
    public int BonusPoints { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }
}
