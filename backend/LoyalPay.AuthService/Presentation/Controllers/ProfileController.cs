using LoyalPay.AuthService.Application.DTOs;
using LoyalPay.AuthService.Application.Interfaces;
using LoyalPay.Shared.Common;
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
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return string.IsNullOrWhiteSpace(value) ? Guid.Empty : Guid.Parse(value);
    }

    [HttpGet]
    public async Task<IActionResult> GetProfile()
    {
        var result = await _authService.GetProfileAsync(GetUserId());
        return Ok(result);
    }

    [HttpPut]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        var result = await _authService.UpdateProfileAsync(GetUserId(), dto);
        return Ok(result);
    }

    [HttpPut("password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var result = await _authService.ChangePasswordAsync(GetUserId(), dto);
        return Ok(result);
    }

    [HttpPost("kyc")]
    public async Task<IActionResult> SubmitKyc([FromBody] KycSubmitDto dto)
    {
        var result = await _authService.SubmitKycAsync(GetUserId(), dto);
        return Ok(result);
    }

    [HttpGet("kyc")]
    public async Task<IActionResult> GetKycStatus()
    {
        var result = await _authService.GetKycStatusAsync(GetUserId());
        return Ok(result);
    }

    /// <summary>
    /// Streams the raw KYC document file back to the caller.
    /// Returns 404 if no submission exists or the file data is empty.
    /// </summary>
    [HttpGet("kyc/document")]
    public async Task<IActionResult> GetKycDocument()
    {
        var result = await _authService.GetKycDocumentAsync(GetUserId());
        if (result == null)
        {
            return NotFound(ApiResponse<string>.Fail("No KYC document found."));
        }

        return File(result.Value.Data, result.Value.ContentType, result.Value.FileName);
    }

    /// <summary>
    /// Resolves an email address to a userId.
    /// Used by the frontend transfer flow before calling POST /api/wallet/transfer.
    /// No auth required — the wallet transfer itself is authenticated.
    /// </summary>
    [HttpGet("lookup")]
    [AllowAnonymous]
    public async Task<IActionResult> Lookup([FromQuery] string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return BadRequest(ApiResponse<string>.Fail("Email is required."));
        }

        var result = await _authService.LookupUserByEmailAsync(email);
        return Ok(result);
    }
}
