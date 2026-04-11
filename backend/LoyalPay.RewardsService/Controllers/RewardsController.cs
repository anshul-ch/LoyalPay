using LoyalPay.RewardsService.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LoyalPay.RewardsService.Controllers;

[ApiController]
[Route("api/rewards")]
[Authorize]
public class RewardsController : ControllerBase
{
    private readonly Services.RewardsService _rewardsService;

    public RewardsController(Services.RewardsService rewardsService)
    {
        _rewardsService = rewardsService;
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

    [HttpGet("summary")]
    public async Task<IActionResult> Summary()
    {
        var result = await _rewardsService.GetSummaryAsync(GetUserId());
        return Ok(result);
    }

    [HttpGet("catalog")]
    [AllowAnonymous]
    public async Task<IActionResult> Catalog()
    {
        var result = await _rewardsService.GetCatalogAsync();
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
