using LoyalPay.Shared.Events;
using LoyalPay.WalletService.Domain.Entities;
using LoyalPay.WalletService.Infrastructure.Persistence.DbContext;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.WalletService.Infrastructure.Messaging;

public class CashbackRedeemedConsumer : IConsumer<CashbackRedeemedEvent>
{
    private readonly WalletDbContext _db;

    public CashbackRedeemedConsumer(WalletDbContext db)
    {
        _db = db;
    }

    public async Task Consume(ConsumeContext<CashbackRedeemedEvent> context)
    {
        var userId = context.Message.UserId;
        var cashbackAmount = context.Message.CashbackAmount;

        if (cashbackAmount <= 0)
        {
            return;
        }

        var wallet = await _db.WalletAccounts.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null)
        {
            wallet = new WalletAccount
            {
                UserId = userId,
                Balance = 0m,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.WalletAccounts.Add(wallet);
            await _db.SaveChangesAsync();
        }

        var alreadyCredited = await _db.LedgerEntries.AnyAsync(e =>
            e.WalletId == wallet.WalletId &&
            e.EntryType == "Credit" &&
            e.Description == $"Cashback redeemed: {context.Message.RedemptionId}");

        if (alreadyCredited)
        {
            return;
        }

        wallet.Balance += cashbackAmount;
        wallet.UpdatedAt = DateTime.UtcNow;

        var ledger = new LedgerEntry
        {
            WalletId = wallet.WalletId,
            EntryType = "Credit",
            Amount = cashbackAmount,
            BalanceAfter = wallet.Balance,
            Description = $"Cashback redeemed: {context.Message.RedemptionId}",
            CreatedAt = DateTime.UtcNow
        };

        _db.LedgerEntries.Add(ledger);
        await _db.SaveChangesAsync();

        await context.Publish(new UserNotificationRequestedEvent(
            userId,
            "Rewards",
            "Cashback credited",
            $"Cashback of INR {cashbackAmount:0.00} has been successfully credited to your wallet. Redemption reference: {context.Message.RedemptionId}. Item: {context.Message.ItemName}.",
            DateTime.UtcNow));
    }
}
