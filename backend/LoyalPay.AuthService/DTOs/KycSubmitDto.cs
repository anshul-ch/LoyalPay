using System.ComponentModel.DataAnnotations;

namespace LoyalPay.AuthService.DTOs;

public class KycSubmitDto
{
    [Required]
    public string DocumentType { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string DocumentNumber { get; set; } = string.Empty;

    [Required]
    public string FileBase64 { get; set; } = string.Empty;
}
