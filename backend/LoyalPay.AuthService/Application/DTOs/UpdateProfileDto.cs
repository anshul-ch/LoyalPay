using System.ComponentModel.DataAnnotations;

namespace LoyalPay.AuthService.Application.DTOs;

public class UpdateProfileDto
{
    [Required(ErrorMessage = "Full name is required.")]
    [MinLength(2, ErrorMessage = "Full name must be at least 2 characters.")]
    [MaxLength(200, ErrorMessage = "Full name cannot exceed 200 characters.")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Phone number is required.")]
    [RegularExpression(@"^\d{10}$", ErrorMessage = "Phone must be exactly 10 digits.")]
    public string Phone { get; set; } = string.Empty;
}
