using System.ComponentModel.DataAnnotations;

namespace LoyalPay.AdminService.Application.DTOs;

public class CampaignDto
{
    [Required(ErrorMessage = "Campaign name is required.")]
    [MinLength(3, ErrorMessage = "Campaign name must be at least 3 characters.")]
    [MaxLength(200, ErrorMessage = "Campaign name cannot exceed 200 characters.")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500, ErrorMessage = "Description cannot exceed 500 characters.")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "Bonus points are required.")]
    [Range(1, 100000, ErrorMessage = "BonusPoints must be between 1 and 100,000.")]
    public int BonusPoints { get; set; }

    [Required(ErrorMessage = "Start date is required.")]
    public DateTime StartDate { get; set; }

    [Required(ErrorMessage = "End date is required.")]
    public DateTime EndDate { get; set; }
}
