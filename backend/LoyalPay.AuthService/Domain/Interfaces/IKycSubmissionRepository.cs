using LoyalPay.AuthService.Domain.Entities;

namespace LoyalPay.AuthService.Domain.Interfaces;

public interface IKycSubmissionRepository
{
    Task<KycSubmission?> GetKycSubmissionByIdAsync(Guid id);

    /// <summary>
    /// Returns the most recent submission for a given user, or null if none exists.
    /// </summary>
    Task<KycSubmission?> GetLatestByUserIdAsync(Guid userId);

    Task<List<KycSubmission>> GetAllByUserIdAsync(Guid userId);
    Task<List<KycSubmission>> GetPendingKycSubmissionsAsync();
    Task AddKycSubmissionAsync(KycSubmission kycSubmission);
    Task UpdateKycSubmissionAsync(KycSubmission kycSubmission);
    Task SaveChangesAsync();
}
