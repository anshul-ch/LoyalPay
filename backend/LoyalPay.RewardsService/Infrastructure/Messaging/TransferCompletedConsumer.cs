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

        var points = (int)Math.Floor(amount / 100m);
        if (points <= 0)
        {
            return;
        }

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

        var exists = await _db.RewardTransactions.AnyAsync(t =>
            t.UserId == userId &&
            t.TxnType == "Earned" &&
            t.Description == $"+{points} pts for transfer #{context.Message.TransferId}");

        if (exists)
        {
            return;
        }

        account.TotalPoints += points;
        account.Tier = GetTier(account.TotalPoints);
        account.UpdatedAt = DateTime.UtcNow;

        _db.RewardTransactions.Add(new RewardTransaction
        {
            UserId = userId,
            TxnType = "Earned",
            Points = points,
            Description = $"+{points} pts for transfer #{context.Message.TransferId}",
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
    }

    private static string GetTier(int points)
    {
        if (points >= 5000) return "Platinum";
        if (points >= 1000) return "Gold";
        return "Silver";
    }
}
