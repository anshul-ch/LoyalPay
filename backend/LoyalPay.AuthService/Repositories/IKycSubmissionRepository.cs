using LoyalPay.AuthService.Models;

namespace LoyalPay.AuthService.Repositories;

public interface IKycSubmissionRepository
{
    Task<KycSubmission?> GetKycSubmissionByIdAsync(Guid id);
    Task<List<KycSubmission>> GetPendingKycSubmissionsAsync();
    Task AddKycSubmissionAsync(KycSubmission kycSubmission);
    Task UpdateKycSubmissionAsync(KycSubmission kycSubmission);
    Task SaveChangesAsync();
}