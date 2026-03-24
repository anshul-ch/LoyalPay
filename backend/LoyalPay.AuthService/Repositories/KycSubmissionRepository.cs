using LoyalPay.AuthService.Data;
using LoyalPay.AuthService.Models;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.AuthService.Repositories;

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

    public async Task<List<KycSubmission>> GetPendingKycSubmissionsAsync()
    {
        return await _db.KycSubmissions
            .Where(k => k.Status == "Pending")
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