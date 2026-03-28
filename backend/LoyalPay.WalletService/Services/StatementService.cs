using CsvHelper;
using LoyalPay.WalletService.Data;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Globalization;

namespace LoyalPay.WalletService.Services;

public class StatementService
{
    private readonly WalletDbContext _db;

    public StatementService(WalletDbContext db)
    {
        _db = db;
    }

    public async Task<byte[]> GetPdfAsync(Guid userId, DateTime from, DateTime to)
    {
        var wallet = await _db.WalletAccounts.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null)
        {
            return Array.Empty<byte>();
        }

        var startOfDay = from.Date;
        var endOfDay = to.Date.AddDays(1).AddSeconds(-1);

        var entries = await _db.LedgerEntries
            .Where(e => e.WalletId == wallet.WalletId && e.CreatedAt >= startOfDay && e.CreatedAt <= endOfDay)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();

        QuestPDF.Settings.License = LicenseType.Community;

        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);

                page.Header().Text($"LoyalPay Statement  |  {from:dd MMM yyyy} - {to:dd MMM yyyy}").Bold().FontSize(14);

                page.Content().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn(2);
                        columns.RelativeColumn(1);
                        columns.RelativeColumn(1);
                        columns.RelativeColumn(1);
                        columns.RelativeColumn(3);
                    });

                    table.Header(header =>
                    {
                        header.Cell().Text("Date").Bold();
                        header.Cell().Text("Type").Bold();
                        header.Cell().Text("Amount").Bold();
                        header.Cell().Text("Balance").Bold();
                        header.Cell().Text("Description").Bold();
                    });

                    foreach (var entry in entries)
                    {
                        table.Cell().Text(entry.CreatedAt.ToString("dd MMM yyyy HH:mm"));
                        table.Cell().Text(entry.EntryType);
                        table.Cell().Text($"INR {entry.Amount:F2}");
                        table.Cell().Text($"INR {entry.BalanceAfter:F2}");
                        table.Cell().Text(entry.Description ?? "-");
                    }
                });

                page.Footer().AlignRight().Text($"Generated {DateTime.Now:dd MMM yyyy HH:mm}").FontSize(9);
            });
        }).GeneratePdf();
    }

    public async Task<byte[]> GetCsvAsync(Guid userId, DateTime from, DateTime to)
    {
        var wallet = await _db.WalletAccounts.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null)
        {
            return Array.Empty<byte>();
        }

        var startOfDay = from.Date;
        var endOfDay = to.Date.AddDays(1).AddSeconds(-1);

        var entries = await _db.LedgerEntries
            .Where(e => e.WalletId == wallet.WalletId && e.CreatedAt >= startOfDay && e.CreatedAt <= endOfDay)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();

        using var ms = new MemoryStream();
        using var writer = new StreamWriter(ms);
        using var csv = new CsvWriter(writer, CultureInfo.InvariantCulture);

        var records = entries.Select(e => new
        {
            Date = e.CreatedAt.ToString("dd MMM yyyy HH:mm"),
            e.EntryType,
            Amount = e.Amount.ToString("F2"),
            BalanceAfter = e.BalanceAfter.ToString("F2"),
            e.Description
        });

        csv.WriteRecords(records);
        writer.Flush();

        return ms.ToArray();
    }
}
