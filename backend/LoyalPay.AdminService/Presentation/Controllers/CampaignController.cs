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
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        return Guid.TryParse(userIdValue, out var userId) ? userId : Guid.Empty;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CampaignDto dto)
    {
        var result = await _adminService.CreateCampaignAsync(dto, GetUserId());
        return Ok(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _adminService.GetCampaignsAsync();
        return Ok(result);
    }

    [HttpPatch("{campaignId}/deactivate")]
    public async Task<IActionResult> Deactivate(Guid campaignId)
    {
        var result = await _adminService.DeactivateCampaignAsync(campaignId, GetUserId());
        return Ok(result);
    }

    [HttpPatch("{campaignId}/activate")]
    public async Task<IActionResult> Activate(Guid campaignId)
    {
        var result = await _adminService.ActivateCampaignAsync(campaignId, GetUserId());
        return Ok(result);
    }

    [HttpDelete("{campaignId}")]
    public async Task<IActionResult> Remove(Guid campaignId)
    {
        var result = await _adminService.RemoveCampaignAsync(campaignId, GetUserId());
        return Ok(result);
    }

    [HttpPost("rewards")]
    public async Task<IActionResult> CreateReward([FromBody] CreateRewardDto dto)
    {
        var result = await _adminService.CreateRewardAsync(dto, GetUserId());
        return Ok(result);
    }

    [HttpGet("rewards")]
    public async Task<IActionResult> GetRewards()
    {
        var result = await _adminService.GetRewardsAsync();
        return Ok(result);
    }

    [HttpPatch("rewards/{rewardId}/deactivate")]
    public async Task<IActionResult> DeactivateReward(Guid rewardId)
    {
        var result = await _adminService.DeactivateRewardAsync(rewardId, GetUserId());
        return Ok(result);
    }

    [HttpPatch("rewards/{rewardId}/activate")]
    public async Task<IActionResult> ActivateReward(Guid rewardId)
    {
        var result = await _adminService.ActivateRewardAsync(rewardId, GetUserId());
        return Ok(result);
    }

    [HttpDelete("rewards/{rewardId}")]
    public async Task<IActionResult> RemoveReward(Guid rewardId)
    {
        var result = await _adminService.RemoveRewardAsync(rewardId, GetUserId());
        return Ok(result);
    }
}
