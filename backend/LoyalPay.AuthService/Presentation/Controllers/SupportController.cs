using LoyalPay.AuthService.Application.DTOs;
using LoyalPay.AuthService.Application.Interfaces;
using LoyalPay.Shared.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LoyalPay.AuthService.Presentation.Controllers;

/// <summary>Support ticket endpoints for users, support agents, and admins.</summary>
[ApiController]
[Authorize]
public class SupportController : ControllerBase
{
    private readonly IAuthService _authService;

    public SupportController(IAuthService authService)
    {
        _authService = authService;
    }

    private Guid GetUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
        return Guid.TryParse(value, out var id) ? id : Guid.Empty;
    }

    // ── User routes ──────────────────────────────────────────────────────────

    /// <summary>Create a new support ticket.</summary>
    [HttpPost("api/support/tickets")]
    [Authorize(Roles = "User")]
    public async Task<IActionResult> CreateTicket([FromBody] CreateTicketDto dto)
    {
        var result = await _authService.CreateTicketAsync(GetUserId(), dto);
        return Ok(result);
    }

    /// <summary>Create a public support ticket for account review or reactivation.</summary>
    [HttpPost("api/support/public-ticket")]
    [AllowAnonymous]
    public async Task<IActionResult> CreatePublicTicket([FromBody] CreatePublicTicketDto dto)
    {
        var result = await _authService.CreatePublicTicketAsync(dto);
        return Ok(result);
    }

    /// <summary>Get all tickets for the current user.</summary>
    [HttpGet("api/support/tickets/my")]
    [Authorize(Roles = "User")]
    public async Task<IActionResult> GetMyTickets()
    {
        var result = await _authService.GetMyTicketsAsync(GetUserId());
        return Ok(result);
    }

    // ── Support / Admin routes ───────────────────────────────────────────────

    /// <summary>Get all tickets (with optional filters).</summary>
    [HttpGet("api/admin/support/tickets")]
    [Authorize(Roles = "Admin,Support")]
    public async Task<IActionResult> GetAllTickets(
        [FromQuery] int page = 1,
        [FromQuery] int size = 20,
        [FromQuery] string? status = null,
        [FromQuery] string? category = null,
        [FromQuery] Guid? assignedTo = null)
    {
        var result = await _authService.GetAllTicketsAsync(page, size, status, category, assignedTo);
        return Ok(result);
    }

    /// <summary>Get a single ticket by ID.</summary>
    [HttpGet("api/admin/support/tickets/{id}")]
    [Authorize(Roles = "Admin,Support")]
    public async Task<IActionResult> GetTicket(Guid id)
    {
        var result = await _authService.GetTicketByIdAsync(id);
        return Ok(result);
    }

    /// <summary>Update ticket status and/or resolution (Support or Admin).</summary>
    [HttpPut("api/admin/support/tickets/{id}")]
    [Authorize(Roles = "Admin,Support")]
    public async Task<IActionResult> UpdateTicket(Guid id, [FromBody] UpdateTicketDto dto)
    {
        var result = await _authService.UpdateTicketAsync(id, dto, GetUserId());
        return Ok(result);
    }

    /// <summary>Assign a ticket to a support agent (Admin only).</summary>
    [HttpPost("api/admin/support/tickets/{id}/assign")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AssignTicket(Guid id, [FromBody] AssignTicketDto dto)
    {
        var result = await _authService.AssignTicketAsync(id, dto.SupportAgentId, GetUserId());
        return Ok(result);
    }

    /// <summary>Support agent requests ticket ownership change; admin approves via Assign.</summary>
    [HttpPost("api/admin/support/tickets/{id}/ownership-request")]
    [Authorize(Roles = "Support")]
    public async Task<IActionResult> RequestOwnership(Guid id, [FromBody] OwnershipRequestDto dto)
    {
        var result = await _authService.RequestTicketOwnershipAsync(id, GetUserId(), dto.Reason);
        return Ok(result);
    }

    /// <summary>Support Agent Management (Admin only) ────────────────────────────────

    /// <summary>Create a new support agent user.</summary>
    [HttpPost("api/admin/support-agents")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateSupportAgent([FromBody] CreateSupportAgentDto dto)
    {
        var result = await _authService.CreateSupportAgentAsync(dto, GetUserId());
        return Ok(result);
    }

    /// <summary>List all support agents.</summary>
    [HttpGet("api/admin/support-agents")]
    [Authorize(Roles = "Admin,Support")]
    public async Task<IActionResult> GetSupportAgents()
    {
        var result = await _authService.GetSupportAgentsAsync();
        return Ok(result);
    }

    /// <summary>Activate a deactivated user account (Admin only).</summary>
    [HttpPost("api/admin/users/{id}/activate")]
    [Authorize(Roles = "Admin,Support")]
    public async Task<IActionResult> ActivateUser(Guid id)
    {
        var result = await _authService.ActivateUserAsync(id, GetUserId());
        return Ok(result);
    }

    /// <summary>Deactivate a user account (Admin only).</summary>
    [HttpPost("api/admin/users/{id}/deactivate")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeactivateUser(Guid id, [FromBody] DeactivateUserDto dto)
    {
        var result = await _authService.DeactivateUserAsync(id, dto.Reason, GetUserId());
        return Ok(result);
    }
}
