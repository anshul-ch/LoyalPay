using LoyalPay.AdminService.Application.Interfaces;
using LoyalPay.AdminService.Application.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LoyalPay.AdminService.Presentation.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class DashboardController : ControllerBase
{
    private readonly IAdminService _adminService;

    public DashboardController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    private Guid GetUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        return Guid.TryParse(value, out var userId) ? userId : Guid.Empty;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        var result = await _adminService.GetDashboardAsync();
        return Ok(result);
    }

    [HttpGet("users")]
    public async Task<IActionResult> Users(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? kycStatus = null,
        [FromQuery] string? tier = null,
        [FromQuery] string? status = null)
    {
        var result = await _adminService.GetUsersPagedAsync(page, pageSize, search, kycStatus, tier, status);
        return Ok(result);
    }

    [HttpPatch("users/{userId}/status")]
    public async Task<IActionResult> UpdateUserStatus(Guid userId, [FromBody] UpdateUserStatusDto dto)
    {
        var result = await _adminService.UpdateUserStatusAsync(userId, dto.IsActive, dto.Reason, GetUserId());
        return Ok(result);
    }
}
