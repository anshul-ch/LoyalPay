using LoyalPay.RewardsService.Domain.Entities;
using LoyalPay.RewardsService.Infrastructure.Persistence.DbContext;
using LoyalPay.Shared.Events;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.RewardsService.Infrastructure.Messaging;

public class TransferCompletedConsumer : IConsumer<TransferCompletedEvent>
{
    private readonly RewardsDbContext _db;

    public TransferCompletedConsumer(RewardsDbContext db)
    {
        _db = db;
    }

    public async Task Consume(ConsumeContext<TransferCompletedEvent> context)
    {
        var userId = context.Message.SenderUserId;
        var amount = context.Message.Amount;

        if (amount <= 0)
        {
            return;
        }

        var points = amount < 100m ? 0 : (int)Math.Floor(amount / 100m);

        var account = await _db.RewardAccounts.FirstOrDefaultAsync(r => r.UserId == userId);
        if (account == null)
        {
            account = new RewardAccount
            {
                UserId = userId,
                TotalPoints = 0,
                Tier = "Silver",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.RewardAccounts.Add(account);
            await _db.SaveChangesAsync();
        }

        var activeCampaigns = await _db.Campaigns
            .Where(c => c.IsActive && c.StartDate <= DateTime.UtcNow && c.EndDate >= DateTime.UtcNow)
            .ToListAsync();

        if (points <= 0 && activeCampaigns.Count == 0)
        {
            return;
        }

        var totalAwardedPoints = 0;

        if (points > 0)
        {
            var exists = await _db.RewardTransactions.AnyAsync(t =>
                t.UserId == userId &&
                t.TxnType == "Earned" &&
                t.Description == $"+{points} pts for transfer #{context.Message.TransferId}");

            if (!exists)
            {
                _db.RewardTransactions.Add(new RewardTransaction
                {
                    UserId = userId,
                    TxnType = "Earned",
                    Points = points,
                    Description = $"+{points} pts for transfer #{context.Message.TransferId}",
                    CreatedAt = DateTime.UtcNow
                });

                totalAwardedPoints += points;
            }
        }

        foreach (var campaign in activeCampaigns)
        {
            if (campaign.BonusPoints <= 0)
            {
                continue;
            }

            var campaignDescription = $"Campaign transfer bonus [{campaign.CampaignId}]";
            var campaignAlreadyAwarded = await _db.RewardTransactions.AnyAsync(t =>
                t.UserId == userId &&
                t.TxnType == "Earned" &&
                t.Description == campaignDescription);

            if (campaignAlreadyAwarded)
            {
                continue;
            }

            _db.RewardTransactions.Add(new RewardTransaction
            {
                UserId = userId,
                TxnType = "Earned",
                Points = campaign.BonusPoints,
                Description = campaignDescription,
                CreatedAt = DateTime.UtcNow
            });

            totalAwardedPoints += campaign.BonusPoints;
        }

        if (totalAwardedPoints <= 0)
        {
            return;
        }

        account.TotalPoints += totalAwardedPoints;
        account.Tier = GetTier(account.TotalPoints);
        account.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
    }

    private static string GetTier(int points)
    {
        if (points >= 5000) return "Platinum";
        if (points >= 1000) return "Gold";
        return "Silver";
    }
}
