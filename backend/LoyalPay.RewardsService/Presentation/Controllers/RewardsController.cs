using LoyalPay.RewardsService.Application.DTOs;
using LoyalPay.RewardsService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LoyalPay.RewardsService.Presentation.Controllers;

[ApiController]
[Route("api/rewards")]
[Authorize]
public class RewardsController : ControllerBase
{
    private readonly IRewardsService _rewardsService;

    public RewardsController(IRewardsService rewardsService)
    {
        _rewardsService = rewardsService;
    }

    private Guid GetUserId()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        return Guid.TryParse(userIdValue, out var userId) ? userId : Guid.Empty;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> Summary()
    {
        var result = await _rewardsService.GetSummaryAsync(GetUserId());
        return Ok(result);
    }

    [HttpGet("catalog")]
    public async Task<IActionResult> Catalog()
    {
        var result = await _rewardsService.GetCatalogAsync(GetUserId());
        return Ok(result);
    }

    [HttpPost("redeem")]
    public async Task<IActionResult> Redeem([FromBody] RedeemDto dto)
    {
        var result = await _rewardsService.RedeemAsync(GetUserId(), dto);
        return Ok(result);
    }

    [HttpGet("history")]
    public async Task<IActionResult> History()
    {
        var result = await _rewardsService.GetHistoryAsync(GetUserId());
        return Ok(result);
    }
}
