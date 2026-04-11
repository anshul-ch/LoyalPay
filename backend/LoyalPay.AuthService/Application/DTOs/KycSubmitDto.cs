using System.ComponentModel.DataAnnotations;

namespace LoyalPay.AuthService.Application.DTOs;

public class KycSubmitDto
{
    [Required(ErrorMessage = "Document type is required.")]
    [RegularExpression(@"^(Aadhaar|PAN|Passport|DrivingLicense)$",
        ErrorMessage = "DocumentType must be one of: Aadhaar, PAN, Passport, DrivingLicense.")]
    public string DocumentType { get; set; } = string.Empty;

    [Required(ErrorMessage = "Document number is required.")]
    [MinLength(4, ErrorMessage = "Document number seems too short.")]
    [MaxLength(100, ErrorMessage = "Document number cannot exceed 100 characters.")]
    public string DocumentNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "File is required.")]
    [MinLength(10, ErrorMessage = "The uploaded file seems invalid (too short).")]
    [MaxLength(8000000, ErrorMessage = "File payload is too large.")]
    public string FileBase64 { get; set; } = string.Empty;
}
