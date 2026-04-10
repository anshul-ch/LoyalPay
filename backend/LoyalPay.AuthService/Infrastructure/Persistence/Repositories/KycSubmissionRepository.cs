using LoyalPay.AuthService.Domain.Entities;
using LoyalPay.AuthService.Domain.Interfaces;
using LoyalPay.AuthService.Infrastructure.Persistence.DbContext;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.AuthService.Infrastructure.Persistence.Repositories;

public class KycSubmissionRepository : IKycSubmissionRepository
{
    private readonly AuthDbContext _db;

    public KycSubmissionRepository(AuthDbContext db)
    {
        _db = db;
    }

    public async Task<KycSubmission?> GetKycSubmissionByIdAsync(Guid id)
    {
        return await _db.KycSubmissions.FindAsync(id);
    }

    public async Task<KycSubmission?> GetLatestByUserIdAsync(Guid userId)
    {
        // Most recent submission ordered by submitted date descending.
        return await _db.KycSubmissions
            .Where(k => k.UserId == userId)
            .OrderByDescending(k => k.SubmittedAt)
            .ThenByDescending(k => k.SubmissionId)
            .FirstOrDefaultAsync();
    }

    public async Task<List<KycSubmission>> GetAllByUserIdAsync(Guid userId)
    {
        return await _db.KycSubmissions
            .Where(k => k.UserId == userId)
            .OrderByDescending(k => k.SubmittedAt)
            .ThenByDescending(k => k.SubmissionId)
            .ToListAsync();
    }

    public async Task<List<KycSubmission>> GetPendingKycSubmissionsAsync()
    {
        return await _db.KycSubmissions
            .Where(k => k.Status == "Pending")
            .OrderByDescending(k => k.SubmittedAt)
            .ThenByDescending(k => k.SubmissionId)
            .ToListAsync();
    }

    public async Task AddKycSubmissionAsync(KycSubmission kycSubmission)
    {
        _db.KycSubmissions.Add(kycSubmission);
    }

    public async Task UpdateKycSubmissionAsync(KycSubmission kycSubmission)
    {
        _db.KycSubmissions.Update(kycSubmission);
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}
