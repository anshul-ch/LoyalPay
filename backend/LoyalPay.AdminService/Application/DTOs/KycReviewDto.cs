using System.ComponentModel.DataAnnotations;

namespace LoyalPay.AdminService.Application.DTOs;

public class KycReviewDto
{
    [Required(ErrorMessage = "Decision is required.")]
    [RegularExpression(@"^(Approved|Rejected)$",
        ErrorMessage = "Decision must be exactly 'Approved' or 'Rejected'.")]
    public string Decision { get; set; } = string.Empty;

    [MaxLength(500, ErrorMessage = "Rejection note cannot exceed 500 characters.")]
    public string? RejectionNote { get; set; }
}
