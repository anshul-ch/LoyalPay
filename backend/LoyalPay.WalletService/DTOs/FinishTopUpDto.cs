using System.ComponentModel.DataAnnotations;

namespace LoyalPay.WalletService.DTOs;

public class FinishTopUpDto
{
    [Required]
    public bool Success { get; set; }
}
