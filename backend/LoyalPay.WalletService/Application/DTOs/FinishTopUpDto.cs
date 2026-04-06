using System.ComponentModel.DataAnnotations;

namespace LoyalPay.WalletService.Application.DTOs;

public class FinishTopUpDto
{
    [Required]
    public bool Success { get; set; }
}
