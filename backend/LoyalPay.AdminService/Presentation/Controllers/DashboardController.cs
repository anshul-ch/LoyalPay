using LoyalPay.AdminService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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

    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        var result = await _adminService.GetDashboardAsync();
        return Ok(result);
    }

    [HttpGet("users")]
    public async Task<IActionResult> Users()
    {
        var result = await _adminService.GetUsersAsync();
        return Ok(result);
    }
}
