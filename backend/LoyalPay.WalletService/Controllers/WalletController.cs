using LoyalPay.WalletService.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LoyalPay.WalletService.Controllers;

[ApiController]
[Route("api/wallet")]
[Authorize]
public class WalletController : ControllerBase
{
    private readonly Services.WalletService _walletService;

    public WalletController(Services.WalletService walletService)
    {
        _walletService = walletService;
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

    [HttpGet("balance")]
    public async Task<IActionResult> GetBalance()
    {
        var result = await _walletService.GetBalanceAsync(GetUserId());
        return Ok(result);
    }

    [HttpPost("topup")]
    public async Task<IActionResult> StartTopUp([FromBody] TopUpDto dto)
    {
        var result = await _walletService.StartTopUpAsync(GetUserId(), dto);
        return Ok(result);
    }

    [HttpPost("topup/{topUpId}/finish")]
    public async Task<IActionResult> FinishTopUp(Guid topUpId, [FromBody] FinishTopUpDto dto)
    {
        var result = await _walletService.FinishTopUpAsync(topUpId, dto.Success);
        return Ok(result);
    }

    [HttpPost("transfer")]
    public async Task<IActionResult> Transfer([FromBody] TransferDto dto)
    {
        var result = await _walletService.TransferAsync(GetUserId(), dto);
        return Ok(result);
    }

    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions([FromQuery] int page = 1, [FromQuery] int size = 20)
    {
        var result = await _walletService.GetTransactionsAsync(GetUserId(), page, size);
        return Ok(result);
    }
}
