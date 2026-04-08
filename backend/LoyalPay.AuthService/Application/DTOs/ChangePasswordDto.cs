using System.ComponentModel.DataAnnotations;

namespace LoyalPay.AuthService.Application.DTOs;

public class ChangePasswordDto
{
    [Required(ErrorMessage = "Current password is required.")]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "New password is required.")]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters long.")]
    [MaxLength(100, ErrorMessage = "Password cannot exceed 100 characters.")]
    [RegularExpression(@"^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$",
        ErrorMessage = "Password must contain at least 1 uppercase letter, 1 number, and 1 special character.")]
    public string NewPassword { get; set; } = string.Empty;
}
