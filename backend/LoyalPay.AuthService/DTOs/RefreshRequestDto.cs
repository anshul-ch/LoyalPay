using System.ComponentModel.DataAnnotations;

namespace LoyalPay.AuthService.DTOs;

public class RefreshRequestDto
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}
