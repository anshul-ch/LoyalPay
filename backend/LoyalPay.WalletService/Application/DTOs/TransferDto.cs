using System.ComponentModel.DataAnnotations;

namespace LoyalPay.WalletService.Application.DTOs;

public class TransferDto
{
    [Required(ErrorMessage = "Receiver user ID is required.")]
    public Guid ReceiverUserId { get; set; }

    [Required(ErrorMessage = "Amount is required.")]
    [Range(1, 25000, ErrorMessage = "Transfer amount must be between ₹1 and ₹25,000.")]
    public decimal Amount { get; set; }

    [MaxLength(200, ErrorMessage = "Note cannot be longer than 200 characters.")]
    public string? Note { get; set; }
}
