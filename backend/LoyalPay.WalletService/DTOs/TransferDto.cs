using System.ComponentModel.DataAnnotations;

namespace LoyalPay.WalletService.DTOs;

public class TransferDto
{
    [Required]
    public Guid ReceiverUserId { get; set; }

    [Required]
    [Range(1, 25000)]
    public decimal Amount { get; set; }

    public string? Note { get; set; }
}
