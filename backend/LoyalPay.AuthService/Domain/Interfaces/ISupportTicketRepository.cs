using LoyalPay.AuthService.Domain.Entities;

namespace LoyalPay.AuthService.Domain.Interfaces;

public interface ISupportTicketRepository
{
    Task<SupportTicket?> GetByIdAsync(Guid ticketId);
    Task<List<SupportTicket>> GetByUserIdAsync(Guid userId);
    Task<List<SupportTicket>> GetAllAsync(int page, int size, string? status, string? category, Guid? assignedTo);
    Task<int> GetTotalCountAsync(string? status, string? category, Guid? assignedTo);
    Task<int> GetNextTicketNumberAsync();
    Task AddAsync(SupportTicket ticket);
    Task SaveChangesAsync();
}
