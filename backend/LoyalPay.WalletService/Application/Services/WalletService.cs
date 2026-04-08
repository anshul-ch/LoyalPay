using LoyalPay.Shared.Common;
using LoyalPay.Shared.Events;
using LoyalPay.WalletService.Application.DTOs;
using LoyalPay.WalletService.Application.Interfaces;
using LoyalPay.WalletService.Domain.Entities;
using LoyalPay.WalletService.Domain.Interfaces;
using MassTransit;

namespace LoyalPay.WalletService.Application.Services;

public class WalletService : IWalletService
{
    private readonly IWalletAccountRepository _walletRepository;
    private readonly ITopUpRequestRepository _topUpRepository;
    private readonly ITransferRequestRepository _transferRepository;
    private readonly ILedgerEntryRepository _ledgerRepository;
    private readonly IPublishEndpoint _publishEndpoint;

    public WalletService(IWalletAccountRepository walletRepository, ITopUpRequestRepository topUpRepository,
        ITransferRequestRepository transferRepository, ILedgerEntryRepository ledgerRepository,
        IPublishEndpoint publishEndpoint)
    {
        _walletRepository = walletRepository;
        _topUpRepository = topUpRepository;
        _transferRepository = transferRepository;
        _ledgerRepository = ledgerRepository;
        _publishEndpoint = publishEndpoint;
    }

    public async Task<ApiResponse<object>> GetBalanceAsync(Guid userId)
    {
        var wallet = await _walletRepository.GetWalletByUserIdAsync(userId);
        if (wallet == null)
        {
            // Auto-create wallet if it doesn't exist (fallback mechanism)
            wallet = new WalletAccount
            {
                UserId = userId,
                Balance = 0,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            await _walletRepository.AddWalletAsync(wallet);
            await _walletRepository.SaveChangesAsync();
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
        var wallet = await _walletRepository.GetWalletByUserIdAsync(userId);
        if (wallet == null)
        {
            // Auto-create wallet if it doesn't exist (fallback mechanism)
            wallet = new WalletAccount
            {
                UserId = userId,
                Balance = 0,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            await _walletRepository.AddWalletAsync(wallet);
            await _walletRepository.SaveChangesAsync();
        }

        var todayStart = DateTime.UtcNow.Date;

        var todayTotal = await _topUpRepository.GetTodaysTotalForWalletAsync(wallet.WalletId, todayStart);

        // Compliance rule: cumulative successful top-ups cannot exceed ₹50,000 per wallet per UTC day.

        if (todayTotal + dto.Amount > 50000)
        {
            return ApiResponse<object>.Fail("Daily top-up limit of ₹50,000 reached.");
        }

        var topUp = new TopUpRequest();
        topUp.WalletId = wallet.WalletId;
        topUp.Amount = dto.Amount;
        topUp.PaymentMethod = dto.PaymentMethod;
        topUp.Status = "Pending";

        await _topUpRepository.AddTopUpRequestAsync(topUp);
        await _topUpRepository.SaveChangesAsync();

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
        var topUp = await _topUpRepository.GetTopUpByIdWithWalletAsync(topUpId);

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
            await _topUpRepository.SaveChangesAsync();
            return ApiResponse<string>.Fail("Payment failed.");
        }

        topUp.Status = "Success";
        
        var wallet = topUp.WalletAccount;
        wallet.Balance = wallet.Balance + topUp.Amount;
        wallet.UpdatedAt = DateTime.UtcNow;

        var ledgerEntry = new LedgerEntry();
        ledgerEntry.WalletId = wallet.WalletId;
        ledgerEntry.EntryType = "Credit";
        ledgerEntry.Amount = topUp.Amount;
        ledgerEntry.BalanceAfter = wallet.Balance;
        ledgerEntry.Description = "Top-up via " + topUp.PaymentMethod;
        ledgerEntry.CreatedAt = DateTime.UtcNow;

        await _topUpRepository.UpdateTopUpRequestAsync(topUp);
        await _walletRepository.UpdateWalletAsync(wallet);
        await _ledgerRepository.AddLedgerEntryAsync(ledgerEntry);
        await _topUpRepository.SaveChangesAsync();

        var topUpCompletedEvent = new TopUpCompletedEvent(wallet.UserId, topUp.Amount);
        await _publishEndpoint.Publish(topUpCompletedEvent);

        return ApiResponse<string>.Ok("Top-up completed successfully.");
    }

    public async Task<ApiResponse<string>> TransferAsync(Guid senderUserId, TransferDto dto)
    {
        var senderWallet = await _walletRepository.GetWalletByUserIdAsync(senderUserId);
        if (senderWallet == null)
        {
            // Auto-create sender wallet if it doesn't exist
            senderWallet = new WalletAccount
            {
                UserId = senderUserId,
                Balance = 0,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            await _walletRepository.AddWalletAsync(senderWallet);
            await _walletRepository.SaveChangesAsync();
        }

        var receiverWallet = await _walletRepository.GetWalletByUserIdAsync(dto.ReceiverUserId);
        if (receiverWallet == null)
        {
            // Auto-create receiver wallet if it doesn't exist
            receiverWallet = new WalletAccount
            {
                UserId = dto.ReceiverUserId,
                Balance = 0,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            await _walletRepository.AddWalletAsync(receiverWallet);
            await _walletRepository.SaveChangesAsync();
        }

        if (senderWallet.WalletId == receiverWallet.WalletId)
        {
            return ApiResponse<string>.Fail("Cannot transfer to your own wallet.");
        }

        if (dto.Amount <= 0)
        {
            return ApiResponse<string>.Fail("Transfer amount must be greater than zero.");
        }

        if (senderWallet.Balance < dto.Amount)
        {
            return ApiResponse<string>.Fail("Insufficient balance.");
        }

        var transferRequest = new TransferRequest();
        transferRequest.SenderWalletId = senderWallet.WalletId;
        transferRequest.ReceiverWalletId = receiverWallet.WalletId;
        transferRequest.Amount = dto.Amount;
        transferRequest.Note = dto.Note;
        transferRequest.CreatedAt = DateTime.UtcNow;

        senderWallet.Balance = senderWallet.Balance - dto.Amount;
        senderWallet.UpdatedAt = DateTime.UtcNow;

        receiverWallet.Balance = receiverWallet.Balance + dto.Amount;
        receiverWallet.UpdatedAt = DateTime.UtcNow;

        var senderEntry = new LedgerEntry();
        senderEntry.WalletId = senderWallet.WalletId;
        senderEntry.EntryType = "Debit";
        senderEntry.Amount = -dto.Amount;
        senderEntry.BalanceAfter = senderWallet.Balance;
        senderEntry.Description = "Transfer to user " + dto.ReceiverUserId;
        senderEntry.CreatedAt = DateTime.UtcNow;

        var receiverEntry = new LedgerEntry();
        receiverEntry.WalletId = receiverWallet.WalletId;
        receiverEntry.EntryType = "Credit";
        receiverEntry.Amount = dto.Amount;
        receiverEntry.BalanceAfter = receiverWallet.Balance;
        receiverEntry.Description = "Transfer from user " + senderUserId;
        receiverEntry.CreatedAt = DateTime.UtcNow;

        await _transferRepository.AddTransferRequestAsync(transferRequest);
        await _walletRepository.UpdateWalletAsync(senderWallet);
        await _walletRepository.UpdateWalletAsync(receiverWallet);
        await _ledgerRepository.AddLedgerEntryAsync(senderEntry);
        await _ledgerRepository.AddLedgerEntryAsync(receiverEntry);
        await _transferRepository.SaveChangesAsync();

        return ApiResponse<string>.Ok("Transfer completed successfully.");
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

        var wallet = await _walletRepository.GetWalletByUserIdAsync(userId);
        if (wallet == null)
        {
            // Auto-create wallet if it doesn't exist (fallback mechanism)
            wallet = new WalletAccount
            {
                UserId = userId,
                Balance = 0,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            await _walletRepository.AddWalletAsync(wallet);
            await _walletRepository.SaveChangesAsync();
        }

        var total = await _ledgerRepository.GetTransactionCountByWalletIdAsync(wallet.WalletId);

        var entries = await _ledgerRepository.GetTransactionsByWalletIdAsync(wallet.WalletId, page, size);

        var entryDtos = entries.Select(e => new TransactionDto
        {
            EntryId = e.EntryId,
            EntryType = e.EntryType,
            Amount = e.Amount,
            BalanceAfter = e.BalanceAfter,
            Description = e.Description,
            CreatedAt = e.CreatedAt
        }).ToList();

        var data = new
        {
            Items = entryDtos,
            Total = total,
            Page = page,
            Size = size
        };

        return ApiResponse<object>.Ok(data);
    }
}
