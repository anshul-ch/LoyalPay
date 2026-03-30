using LoyalPay.AuthService.DTOs;
using LoyalPay.AuthService.Services;
using LoyalPay.Shared.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LoyalPay.AuthService.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly LoyalPay.AuthService.Services.AuthService _authService;

    public AuthController(LoyalPay.AuthService.Services.AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("signup")]
    [AllowAnonymous]
    public async Task<IActionResult> Signup([FromBody] SignupDto dto)
    {
        var result = await _authService.SignupAsync(dto);
        return Ok(result);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var result = await _authService.LoginAsync(dto);
        return Ok(result);
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequestDto dto)
    {
        var result = await _authService.RefreshAsync(dto.RefreshToken);
        return Ok(result);
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout([FromBody] RefreshRequestDto dto)
    {
        await _authService.LogoutAsync(dto.RefreshToken);
        return Ok(ApiResponse<string>.Ok("Logged out."));
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        var result = await _authService.ForgotPasswordAsync(dto);
        return Ok(result);
    }
}
