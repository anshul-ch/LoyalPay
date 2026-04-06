namespace LoyalPay.RewardsService.Application.DTOs;

public class RewardSummaryDto
{
    public int TotalPoints { get; set; }
    public string Tier { get; set; } = string.Empty;
    public string TierProgress { get; set; } = string.Empty;
}
