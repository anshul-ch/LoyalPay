using LoyalPay.AuthService.Domain.Entities;
using LoyalPay.AuthService.Domain.Interfaces;
using LoyalPay.AuthService.Infrastructure.Persistence.DbContext;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.AuthService.Infrastructure.Persistence.Repositories;

public class SupportTicketRepository : ISupportTicketRepository
{
    private readonly AuthDbContext _db;

    public SupportTicketRepository(AuthDbContext db)
    {
        _db = db;
    }

    public async Task<SupportTicket?> GetByIdAsync(Guid ticketId)
    {
        return await _db.SupportTickets
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TicketId == ticketId);
    }

    public async Task<List<SupportTicket>> GetByUserIdAsync(Guid userId)
    {
        return await _db.SupportTickets
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<SupportTicket>> GetAllAsync(int page, int size, string? status, string? category, Guid? assignedTo)
    {
        var query = _db.SupportTickets.Include(t => t.User).AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(t => t.Status == status);

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(t => t.Category == category);

        if (assignedTo.HasValue)
            query = query.Where(t => t.AssignedToUserId == assignedTo.Value);

        return await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * size)
            .Take(size)
            .ToListAsync();
    }

    public async Task<int> GetTotalCountAsync(string? status, string? category, Guid? assignedTo)
    {
        var query = _db.SupportTickets.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(t => t.Status == status);

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(t => t.Category == category);

        if (assignedTo.HasValue)
            query = query.Where(t => t.AssignedToUserId == assignedTo.Value);

        return await query.CountAsync();
    }

    public async Task<int> GetNextTicketNumberAsync()
    {
        var count = await _db.SupportTickets.CountAsync();
        return count + 1;
    }

    public async Task AddAsync(SupportTicket ticket)
    {
        await _db.SupportTickets.AddAsync(ticket);
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}
