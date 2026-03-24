namespace LoyalPay.RewardsService.DTOs;

public class RewardTransactionDto
{
    public Guid TransactionId { get; set; }
    public string TransactionType { get; set; } = string.Empty;
    public int Points { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}