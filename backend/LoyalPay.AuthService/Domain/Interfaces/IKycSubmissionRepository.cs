using LoyalPay.AuthService.Domain.Entities;

namespace LoyalPay.AuthService.Domain.Interfaces;

public interface IKycSubmissionRepository
{
    Task<KycSubmission?> GetKycSubmissionByIdAsync(Guid id);
    Task<List<KycSubmission>> GetPendingKycSubmissionsAsync();
    Task AddKycSubmissionAsync(KycSubmission kycSubmission);
    Task UpdateKycSubmissionAsync(KycSubmission kycSubmission);
    Task SaveChangesAsync();
}
