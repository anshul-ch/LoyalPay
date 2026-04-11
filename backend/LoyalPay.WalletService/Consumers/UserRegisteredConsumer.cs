using LoyalPay.Shared.Events;
using LoyalPay.WalletService.Data;
using LoyalPay.WalletService.Models;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.WalletService.Consumers;

public class UserRegisteredConsumer : IConsumer<UserRegisteredEvent>
{
    private readonly WalletDbContext _db;

    public UserRegisteredConsumer(WalletDbContext db)
    {
        _db = db;
    }

    public async Task Consume(ConsumeContext<UserRegisteredEvent> context)
    {
        var already = await _db.WalletAccounts.AnyAsync(w => w.UserId == context.Message.UserId);
        if (already)
        {
            return;
        }

        var wallet = new WalletAccount();
        wallet.UserId = context.Message.UserId;
        wallet.Balance = 0;
        wallet.IsActive = true;

        _db.WalletAccounts.Add(wallet);
        await _db.SaveChangesAsync();
    }
}
