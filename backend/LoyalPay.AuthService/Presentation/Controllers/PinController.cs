using LoyalPay.AuthService.Application.DTOs;
using LoyalPay.AuthService.Application.Interfaces;
using LoyalPay.Shared.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LoyalPay.AuthService.Presentation.Controllers;

/// <summary>Transaction PIN endpoints — all require authentication.</summary>
[ApiController]
[Route("api/pin")]
[Authorize]
public class PinController : ControllerBase
{
    private readonly IAuthService _authService;

    public PinController(IAuthService authService)
    {
        _authService = authService;
    }

    private Guid GetUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
        return Guid.TryParse(value, out var id) ? id : Guid.Empty;
    }

    /// <summary>One-time PIN setup. Error if PIN already exists.</summary>
    [HttpPost("set")]
    [Authorize(Roles = "User")]
    public async Task<IActionResult> SetPin([FromBody] SetPinDto dto)
    {
        var result = await _authService.SetTransactionPinAsync(GetUserId(), dto.Pin);
        return Ok(result);
    }

    /// <summary>Verify PIN before a transaction. Returns { data: true/false }.</summary>
    [HttpPost("verify")]
    [Authorize(Roles = "User")]
    public async Task<IActionResult> VerifyPin([FromBody] VerifyPinDto dto)
    {
        var result = await _authService.VerifyTransactionPinAsync(GetUserId(), dto.Pin);
        return Ok(result);
    }

    /// <summary>Check if the current user has a PIN set.</summary>
    [HttpGet("status")]
    [Authorize(Roles = "User")]
    public async Task<IActionResult> GetPinStatus()
    {
        var result = await _authService.GetPinStatusAsync(GetUserId());
        return Ok(result);
    }

    /// <summary>Support-agent-only PIN reset after user opens a PinReset ticket.</summary>
    [HttpPost("reset")]
    [Authorize(Roles = "Support")]
    public async Task<IActionResult> ResetPin([FromBody] ResetUserPinDto dto)
    {
        var result = await _authService.ResetTransactionPinAsync(GetUserId(), dto);
        return Ok(result);
    }
}
