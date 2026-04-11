using LoyalPay.Shared.Common;
using LoyalPay.Shared.Events;
using LoyalPay.WalletService.Data;
using LoyalPay.WalletService.DTOs;
using LoyalPay.WalletService.Models;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.WalletService.Services;

public class WalletService
{
    private readonly WalletDbContext _db;
    private readonly IPublishEndpoint _publishEndpoint;

    public WalletService(WalletDbContext db, IPublishEndpoint publishEndpoint)
    {
        _db = db;
        _publishEndpoint = publishEndpoint;
    }

    public async Task<ApiResponse<object>> GetBalanceAsync(Guid userId)
    {
        var wallet = await _db.WalletAccounts.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null)
        {
            return ApiResponse<object>.Fail("Wallet not found.");
        }

        var data = new
        {
            wallet.WalletId,
            wallet.Balance,
            Currency = "INR",
            wallet.UpdatedAt
        };

        return ApiResponse<object>.Ok(data);
    }

    public async Task<ApiResponse<object>> StartTopUpAsync(Guid userId, TopUpDto dto)
    {
        var wallet = await _db.WalletAccounts.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null)
        {
            return ApiResponse<object>.Fail("Wallet not found.");
        }

        var todayStart = DateTime.UtcNow.Date;

        var todayTotal = await _db.TopUpRequests
            .Where(t => t.WalletId == wallet.WalletId && t.Status == "Success" && t.CreatedAt >= todayStart)
            .SumAsync(t => (decimal?)t.Amount) ?? 0;

        if (todayTotal + dto.Amount > 50000)
        {
            return ApiResponse<object>.Fail("Daily top-up limit of ₹50,000 reached.");
        }

        var topUp = new TopUpRequest();
        topUp.WalletId = wallet.WalletId;
        topUp.Amount = dto.Amount;
        topUp.PaymentMethod = dto.PaymentMethod;
        topUp.Status = "Pending";

        _db.TopUpRequests.Add(topUp);
        await _db.SaveChangesAsync();

        var data = new
        {
            topUp.TopUpId,
            topUp.Amount,
            topUp.Status
        };

        return ApiResponse<object>.Ok(data);
    }

    public async Task<ApiResponse<string>> FinishTopUpAsync(Guid topUpId, bool success)
    {
        var topUp = await _db.TopUpRequests
            .Include(t => t.WalletAccount)
            .FirstOrDefaultAsync(t => t.TopUpId == topUpId);

        if (topUp == null)
        {
            return ApiResponse<string>.Fail("Top-up not found.");
        }

        if (topUp.Status != "Pending")
        {
            return ApiResponse<string>.Fail("Already processed.");
        }

        if (!success)
        {
            topUp.Status = "Failed";
            await _db.SaveChangesAsync();
            return ApiResponse<string>.Fail("Payment failed.");
        }

        using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            topUp.Status = "Success";

            var newBalance = topUp.WalletAccount.Balance + topUp.Amount;
            topUp.WalletAccount.Balance = newBalance;
            topUp.WalletAccount.UpdatedAt = DateTime.UtcNow;

            var ledgerEntry = new LedgerEntry();
            ledgerEntry.WalletId = topUp.WalletId;
            ledgerEntry.EntryType = "CREDIT";
            ledgerEntry.Amount = topUp.Amount;
            ledgerEntry.BalanceAfter = newBalance;
            ledgerEntry.Description = "Top-up via " + topUp.PaymentMethod;

            _db.LedgerEntries.Add(ledgerEntry);

            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            await _publishEndpoint.Publish(new TopUpCompletedEvent(topUp.WalletAccount.UserId, topUp.Amount));

            return ApiResponse<string>.Ok("Top-up successful!");
        }
        catch
        {
            await tx.RollbackAsync();
            return ApiResponse<string>.Fail("Something went wrong. Please try again.");
        }
    }

    public async Task<ApiResponse<string>> TransferAsync(Guid senderUserId, TransferDto dto)
    {
        var senderWallet = await _db.WalletAccounts.FirstOrDefaultAsync(w => w.UserId == senderUserId);
        var receiverWallet = await _db.WalletAccounts.FirstOrDefaultAsync(w => w.UserId == dto.ReceiverUserId);

        if (senderWallet == null)
        {
            return ApiResponse<string>.Fail("Your wallet was not found.");
        }

        if (receiverWallet == null)
        {
            return ApiResponse<string>.Fail("Recipient wallet not found.");
        }

        if (senderWallet.WalletId == receiverWallet.WalletId)
        {
            return ApiResponse<string>.Fail("Cannot transfer to yourself.");
        }

        if (senderWallet.Balance < dto.Amount)
        {
            return ApiResponse<string>.Fail("Insufficient balance.");
        }

        var todayStart = DateTime.UtcNow.Date;
        var todaySent = await _db.TransferRequests
            .Where(t => t.SenderWalletId == senderWallet.WalletId && t.CreatedAt >= todayStart)
            .SumAsync(t => (decimal?)t.Amount) ?? 0;

        if (todaySent + dto.Amount > 25000)
        {
            return ApiResponse<string>.Fail("Daily transfer limit of ₹25,000 reached.");
        }

        using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            senderWallet.Balance = senderWallet.Balance - dto.Amount;
            senderWallet.UpdatedAt = DateTime.UtcNow;

            var senderLedger = new LedgerEntry();
            senderLedger.WalletId = senderWallet.WalletId;
            senderLedger.EntryType = "DEBIT";
            senderLedger.Amount = dto.Amount;
            senderLedger.BalanceAfter = senderWallet.Balance;
            senderLedger.Description = dto.Note ?? "Transfer sent";
            _db.LedgerEntries.Add(senderLedger);

            receiverWallet.Balance = receiverWallet.Balance + dto.Amount;
            receiverWallet.UpdatedAt = DateTime.UtcNow;

            var receiverLedger = new LedgerEntry();
            receiverLedger.WalletId = receiverWallet.WalletId;
            receiverLedger.EntryType = "CREDIT";
            receiverLedger.Amount = dto.Amount;
            receiverLedger.BalanceAfter = receiverWallet.Balance;
            receiverLedger.Description = "Transfer received";
            _db.LedgerEntries.Add(receiverLedger);

            var transfer = new TransferRequest();
            transfer.SenderWalletId = senderWallet.WalletId;
            transfer.ReceiverWalletId = receiverWallet.WalletId;
            transfer.Amount = dto.Amount;
            transfer.Note = dto.Note;
            _db.TransferRequests.Add(transfer);

            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            return ApiResponse<string>.Ok("Transfer successful!");
        }
        catch
        {
            await tx.RollbackAsync();
            return ApiResponse<string>.Fail("Transfer failed. Please try again.");
        }
    }

    public async Task<ApiResponse<object>> GetTransactionsAsync(Guid userId, int page, int size)
    {
        if (page < 1)
        {
            page = 1;
        }

        if (size < 1)
        {
            size = 20;
        }

        var wallet = await _db.WalletAccounts.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null)
        {
            return ApiResponse<object>.Fail("Wallet not found.");
        }

        var total = await _db.LedgerEntries.CountAsync(e => e.WalletId == wallet.WalletId);

        var entries = await _db.LedgerEntries
            .Where(e => e.WalletId == wallet.WalletId)
            .OrderByDescending(e => e.CreatedAt)
            .Skip((page - 1) * size)
            .Take(size)
            .Select(e => new TransactionDto
            {
                EntryId = e.EntryId,
                EntryType = e.EntryType,
                Amount = e.Amount,
                BalanceAfter = e.BalanceAfter,
                Description = e.Description,
                CreatedAt = e.CreatedAt
            })
            .ToListAsync();

        var data = new
        {
            Items = entries,
            Total = total,
            Page = page,
            Size = size
        };

        return ApiResponse<object>.Ok(data);
    }
}
