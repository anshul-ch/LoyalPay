using System.ComponentModel.DataAnnotations;

namespace LoyalPay.AuthService.Application.DTOs;

public class SetPinDto
{
    [Required]
    [RegularExpression(@"^\d{5}$", ErrorMessage = "PIN must be exactly 5 digits.")]
    public string Pin { get; set; } = string.Empty;
}

public class VerifyPinDto
{
    [Required]
    public string Pin { get; set; } = string.Empty;
}

public class CreateTicketDto
{
    [Required]
    [MaxLength(50)]
    public string Category { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Subject { get; set; } = string.Empty;

    [Required]
    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;
}

public class UpdateTicketDto
{
    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Resolution { get; set; }
}

public class AssignTicketDto
{
    [Required]
    public Guid SupportAgentId { get; set; }
}

public class CreateSupportAgentDto
{
    [Required]
    [MaxLength(200)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    public string Password { get; set; } = string.Empty;
}

public class ResetUserPinDto
{
    [Required]
    public Guid TicketId { get; set; }

    [Required]
    public Guid UserId { get; set; }

    [Required]
    [RegularExpression(@"^\d{5}$", ErrorMessage = "PIN must be exactly 5 digits.")]
    public string NewPin { get; set; } = string.Empty;
}
