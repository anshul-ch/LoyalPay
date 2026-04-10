using System.ComponentModel.DataAnnotations;

namespace LoyalPay.AdminService.Application.DTOs;

public class UpdateUserStatusDto
{
    [Required(ErrorMessage = "isActive is required.")]
    public bool IsActive { get; set; }
}
