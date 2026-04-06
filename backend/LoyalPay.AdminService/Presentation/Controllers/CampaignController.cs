using LoyalPay.AdminService.Application.DTOs;
using LoyalPay.AdminService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LoyalPay.AdminService.Presentation.Controllers;

[ApiController]
[Route("api/admin/campaigns")]
[Authorize(Roles = "Admin")]
public class CampaignController : ControllerBase
{
    private readonly IAdminService _adminService;

    public CampaignController(IAdminService adminService)
    {
        _adminService = adminService;
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

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CampaignDto dto)
    {
        var result = await _adminService.CreateCampaignAsync(dto, GetUserId());
        return Ok(result);
    }
}
