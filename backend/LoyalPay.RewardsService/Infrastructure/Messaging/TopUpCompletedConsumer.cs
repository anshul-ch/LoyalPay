using LoyalPay.RewardsService.Domain.Entities;
using LoyalPay.RewardsService.Infrastructure.Persistence.DbContext;
using LoyalPay.Shared.Entities;
using LoyalPay.Shared.Events;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.RewardsService.Infrastructure.Messaging;

public class TopUpCompletedConsumer : IConsumer<TopUpCompletedEvent>
{
    private readonly RewardsDbContext _db;

    public TopUpCompletedConsumer(RewardsDbContext db)
    {
        _db = db;
    }

    public async Task Consume(ConsumeContext<TopUpCompletedEvent> context)
    {
        var account = await _db.RewardAccounts.FirstOrDefaultAsync(r => r.UserId == context.Message.UserId);
        if (account == null)
        {
            // Reward account should have been created by UserRegisteredConsumer.
            // If it's missing, skip silently — points can't be awarded without an account.
            return;
        }

        // Base points: 1 point for every ₹100 topped up.
        var points = (int)Math.Floor(context.Message.Amount / 100);

        // First top-up bonus: extra 100 points if the user has never earned before.
        var isFirstTopUp = !await _db.RewardTransactions
            .AnyAsync(t => t.UserId == context.Message.UserId && t.TxnType == "Earned");

        if (isFirstTopUp)
        {
            points = points + 100;
        }

        if (points <= 0)
        {
            return;
        }

        account.TotalPoints = account.TotalPoints + points;
        account.Tier = GetTier(account.TotalPoints);
        account.UpdatedAt = DateTime.UtcNow;

        // Build the description for this transaction
        string description;
        if (isFirstTopUp)
        {
            description = "+" + points + " pts (includes 100 first top-up bonus)";
        }
        else
        {
            description = "+" + points + " pts for top-up of ₹" + context.Message.Amount;
        }

        var transaction = new RewardTransaction();
        transaction.UserId = context.Message.UserId;
        transaction.TxnType = "Earned";
        transaction.Points = points;
        transaction.Description = description;
        transaction.CreatedAt = DateTime.UtcNow;
        _db.RewardTransactions.Add(transaction);

        // Check if any campaign is active RIGHT NOW and give bonus points
        var now = DateTime.UtcNow;
        var activeCampaigns = await _db.Campaigns
            .Where(c => c.IsActive && c.StartDate <= now && c.EndDate >= now)
            .ToListAsync();

        foreach (var campaign in activeCampaigns)
        {
            account.TotalPoints = account.TotalPoints + campaign.BonusPoints;
            account.Tier = GetTier(account.TotalPoints);
            account.UpdatedAt = DateTime.UtcNow;

            var bonusTransaction = new RewardTransaction();
            bonusTransaction.UserId = context.Message.UserId;
            bonusTransaction.TxnType = "Earned";
            bonusTransaction.Points = campaign.BonusPoints;
            bonusTransaction.Description = "Bonus from campaign: " + campaign.Name;
            bonusTransaction.CreatedAt = DateTime.UtcNow;
            _db.RewardTransactions.Add(bonusTransaction);
        }

        await _db.SaveChangesAsync();
    }

    private static string GetTier(int points)
    {
        if (points >= 5000)
        {
            return "Platinum";
        }

        if (points >= 1000)
        {
            return "Gold";
        }

        return "Silver";
    }
}
