using LoyalPay.AdminService.Application.DTOs;
using LoyalPay.AdminService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LoyalPay.AdminService.Presentation.Controllers;

[ApiController]
[Route("api/admin/kyc")]
[Authorize(Roles = "Admin")]
public class KycController : ControllerBase
{
    private readonly IAdminService _adminService;

    public KycController(IAdminService adminService)
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

    [HttpGet("pending")]
    public async Task<IActionResult> Pending()
    {
        var result = await _adminService.GetPendingKycAsync();
        return Ok(result);
    }

    [HttpPost("{id}/approve")]
    public async Task<IActionResult> Approve(Guid id)
    {
        var dto = new KycReviewDto();
        dto.Decision = "Approved";

        var result = await _adminService.ReviewKycAsync(id, dto, GetUserId());
        return Ok(result);
    }

    [HttpPost("{id}/reject")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] KycReviewDto dto)
    {
        dto.Decision = "Rejected";
        var result = await _adminService.ReviewKycAsync(id, dto, GetUserId());
        return Ok(result);
    }
}
