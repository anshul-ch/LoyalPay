using System.ComponentModel.DataAnnotations;

namespace LoyalPay.AdminService.DTOs;

public class KycReviewDto
{
    [Required]
    public string Decision { get; set; } = string.Empty;

    public string? RejectionNote { get; set; }
}
