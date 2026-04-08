using System.ComponentModel.DataAnnotations;

namespace LoyalPay.AdminService.Application.DTOs;

/// <summary>
/// Body for the reject endpoint — only the optional rejection note is accepted.
/// The "Rejected" decision is set by the controller, not the caller.
/// </summary>
public class KycRejectDto
{
    [MaxLength(500, ErrorMessage = "Rejection note cannot exceed 500 characters.")]
    public string? RejectionNote { get; set; }
}
