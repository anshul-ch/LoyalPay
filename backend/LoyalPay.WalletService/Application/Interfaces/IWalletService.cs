using LoyalPay.WalletService.Application.DTOs;
using LoyalPay.Shared.Common;

namespace LoyalPay.WalletService.Application.Interfaces;

public interface IWalletService
{
    Task<ApiResponse<object>> GetBalanceAsync(Guid userId);
    Task<ApiResponse<object>> StartTopUpAsync(Guid userId, TopUpDto dto);
    /// <summary>
    /// Finalizes a pending top-up, posts ledger entries, and publishes a top-up completed event on success.
    /// </summary>
    /// <returns>Failure when top-up is missing/already processed/payment failed; success otherwise.</returns>

    Task<ApiResponse<string>> FinishTopUpAsync(Guid topUpId, bool success);

    /// <summary>
    /// Moves funds between wallets and records debit/credit ledger entries in one workflow.
    /// </summary>

    Task<ApiResponse<string>> TransferAsync(Guid senderUserId, TransferDto dto);
    Task<ApiResponse<object>> GetTransactionsAsync(Guid userId, int page, int size);
}
