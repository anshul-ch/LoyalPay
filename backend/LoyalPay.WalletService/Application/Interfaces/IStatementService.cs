namespace LoyalPay.WalletService.Application.Interfaces;

public interface IStatementService
{
    /// <summary>
    /// Builds a PDF statement for the date range using the caller's wallet ledger entries.
    /// </summary>
    /// <returns>Empty byte array when the wallet does not exist.</returns>

    Task<byte[]> GetPdfAsync(Guid userId, DateTime from, DateTime to);

    /// <summary>
    /// Builds a CSV statement for the date range using the caller's wallet ledger entries.
    /// </summary>
    /// <returns>Empty byte array when the wallet does not exist.</returns>

    Task<byte[]> GetCsvAsync(Guid userId, DateTime from, DateTime to);
}
