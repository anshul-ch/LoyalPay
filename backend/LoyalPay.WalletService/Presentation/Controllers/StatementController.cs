using LoyalPay.WalletService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LoyalPay.WalletService.Presentation.Controllers;

[ApiController]
[Route("api/statement")]
[Authorize]
public class StatementController : ControllerBase
{
    private readonly IStatementService _statementService;

    public StatementController(IStatementService statementService)
    {
        _statementService = statementService;
    }

    private Guid GetUserId()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        return Guid.TryParse(userIdValue, out var userId) ? userId : Guid.Empty;
    }

    [HttpGet("pdf")]
    public async Task<IActionResult> Pdf([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        // Default to the last 30 days when no range is provided.
        var effectiveTo   = to   ?? DateTime.UtcNow;
        var effectiveFrom = from ?? effectiveTo.AddDays(-30);

        var bytes = await _statementService.GetPdfAsync(GetUserId(), effectiveFrom, effectiveTo);
        return File(bytes, "application/pdf", "loyalpay-statement.pdf");
    }

    [HttpGet("csv")]
    public async Task<IActionResult> Csv([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        // Default to the last 30 days when no range is provided.
        var effectiveTo   = to   ?? DateTime.UtcNow;
        var effectiveFrom = from ?? effectiveTo.AddDays(-30);

        var bytes = await _statementService.GetCsvAsync(GetUserId(), effectiveFrom, effectiveTo);
        return File(bytes, "text/csv", "loyalpay-statement.csv");
    }
}
