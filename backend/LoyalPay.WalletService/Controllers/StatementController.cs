using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LoyalPay.WalletService.Controllers;

[ApiController]
[Route("api/statement")]
[Authorize]
public class StatementController : ControllerBase
{
    private readonly Services.StatementService _statementService;

    public StatementController(Services.StatementService statementService)
    {
        _statementService = statementService;
    }

    private Guid GetUserId()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userIdValue))
        {
            return Guid.Empty;
        }

        return Guid.Parse(userIdValue);
    }

    [HttpGet("pdf")]
    public async Task<IActionResult> Pdf([FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        var bytes = await _statementService.GetPdfAsync(GetUserId(), from, to);
        return File(bytes, "application/pdf", "loyalpay-statement.pdf");
    }

    [HttpGet("csv")]
    public async Task<IActionResult> Csv([FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        var bytes = await _statementService.GetCsvAsync(GetUserId(), from, to);
        return File(bytes, "text/csv", "loyalpay-statement.csv");
    }
}
