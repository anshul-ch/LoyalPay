using System.ComponentModel.DataAnnotations;

namespace LoyalPay.WalletService.DTOs;

public class TopUpDto
{
    [Required]
    [Range(1, 50000)]
    public decimal Amount { get; set; }

    [Required]
    public string PaymentMethod { get; set; } = string.Empty;
}
