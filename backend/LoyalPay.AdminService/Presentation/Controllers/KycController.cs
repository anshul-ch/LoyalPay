using LoyalPay.AdminService.Application.DTOs;
using LoyalPay.AdminService.Application.Interfaces;
using LoyalPay.Shared.Common;
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
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return string.IsNullOrWhiteSpace(value) ? Guid.Empty : Guid.Parse(value);
    }

    [HttpGet("pending")]
    public async Task<IActionResult> Pending()
    {
        var result = await _adminService.GetPendingKycAsync();
        return Ok(result);
    }

    /// <summary>
    /// Returns all KYC submissions for a specific user (full history).
    /// </summary>
    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetByUser(Guid userId)
    {
        var result = await _adminService.GetKycSubmissionsByUserAsync(userId);
        return Ok(result);
    }

    /// <summary>
    /// Streams the raw document file for a given submission back to the caller.
    /// </summary>
    [HttpGet("{submissionId}/document")]
    public async Task<IActionResult> GetDocument(Guid submissionId)
    {
        var result = await _adminService.GetKycDocumentAsync(submissionId);
        if (result == null)
        {
            return NotFound(ApiResponse<string>.Fail("Document not found."));
        }

        return File(result.Value.Data, result.Value.ContentType, result.Value.FileName);
    }

    [HttpPost("{id}/approve")]
    public async Task<IActionResult> Approve(Guid id)
    {
        var dto = new KycReviewDto { Decision = "Approved" };
        var result = await _adminService.ReviewKycAsync(id, dto, GetUserId());
        return Ok(result);
    }

    [HttpPost("{id}/reject")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] KycRejectDto dto)
    {
        // Decision is always "Rejected" for this endpoint.
        var reviewDto = new KycReviewDto
        {
            Decision = "Rejected",
            RejectionNote = dto?.RejectionNote
        };
        var result = await _adminService.ReviewKycAsync(id, reviewDto, GetUserId());
        return Ok(result);
    }
}
