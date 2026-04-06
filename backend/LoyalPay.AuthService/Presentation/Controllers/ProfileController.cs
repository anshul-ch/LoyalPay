using LoyalPay.AuthService.Application.DTOs;
using LoyalPay.AuthService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LoyalPay.AuthService.Presentation.Controllers;

[ApiController]
[Route("api/profile")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly IAuthService _authService;

    public ProfileController(IAuthService authService)
    {
        _authService = authService;
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

    [HttpGet]
    public async Task<IActionResult> GetProfile()
    {
        var result = await _authService.GetProfileAsync(GetUserId());
        return Ok(result);
    }

    [HttpPost("kyc")]
    public async Task<IActionResult> SubmitKyc([FromBody] KycSubmitDto dto)
    {
        var result = await _authService.SubmitKycAsync(GetUserId(), dto);
        return Ok(result);
    }
}
