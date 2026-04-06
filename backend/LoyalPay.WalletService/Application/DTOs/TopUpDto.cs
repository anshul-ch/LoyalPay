using System.ComponentModel.DataAnnotations;

namespace LoyalPay.WalletService.Application.DTOs;

public class TopUpDto
{
    [Required(ErrorMessage = "Amount is required.")]
    [Range(1, 50000, ErrorMessage = "Amount must be between ₹1 and ₹50,000.")]
    public decimal Amount { get; set; }

    [Required(ErrorMessage = "Payment method is required.")]
    [RegularExpression(@"^(UPI|Card|NetBanking)$",
        ErrorMessage = "PaymentMethod must be one of: UPI, Card, NetBanking.")]
    public string PaymentMethod { get; set; } = string.Empty;
}
