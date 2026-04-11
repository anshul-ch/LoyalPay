using LoyalPay.RewardsService.Data;
using LoyalPay.RewardsService.Models;
using LoyalPay.Shared.Events;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.RewardsService.Consumers;

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
            return;
        }

        var points = (int)Math.Floor(context.Message.Amount / 100);

        var isFirstTopUp = !await _db.RewardTransactions
            .AnyAsync(t => t.UserId == context.Message.UserId && t.TxnType == "EARN");

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

        var transaction = new RewardTransaction();
        transaction.UserId = context.Message.UserId;
        transaction.TxnType = "EARN";
        transaction.Points = points;

        if (isFirstTopUp)
        {
            transaction.Description = "+" + points + " pts (includes 100 first top-up bonus)";
        }
        else
        {
            transaction.Description = "+" + points + " pts for top-up";
        }

        _db.RewardTransactions.Add(transaction);
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
