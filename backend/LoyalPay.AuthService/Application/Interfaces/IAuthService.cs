using LoyalPay.AuthService.Application.DTOs;
using LoyalPay.Shared.Common;
using LoyalPay.Shared.Events;

namespace LoyalPay.AuthService.Application.Interfaces;

public interface IAuthService
{
    /// <summary>
    /// Creates a new user, publishes <see cref="UserRegisteredEvent"/>, then issues a token pair.
    /// </summary>
    Task<ApiResponse<TokenDto>> SignupAsync(SignupDto dto);

    Task<ApiResponse<TokenDto>> LoginAsync(LoginDto dto);

    /// <summary>
    /// Revokes the current refresh token before issuing a replacement token pair.
    /// </summary>
    Task<ApiResponse<TokenDto>> RefreshAsync(string refreshToken);

    Task LogoutAsync(string refreshToken);

    /// <summary>
    /// Uses the same outward response for existing and non-existing emails to prevent
    /// account enumeration. Active users also receive a temporary password in this environment.
    /// </summary>
    Task<ApiResponse<string>> ForgotPasswordAsync(ForgotPasswordDto dto);

    Task<ApiResponse<object>> GetProfileAsync(Guid userId);

    /// <summary>
    /// Updates the user's display name and phone number.
    /// </summary>
    Task<ApiResponse<object>> UpdateProfileAsync(Guid userId, UpdateProfileDto dto);

    /// <summary>
    /// Verifies the current password before applying the new one and revoking all active sessions.
    /// </summary>
    Task<ApiResponse<string>> ChangePasswordAsync(Guid userId, ChangePasswordDto dto);

    /// <summary>
    /// Stores the KYC document as binary data in the database (no filesystem writes).
    /// </summary>
    Task<ApiResponse<string>> SubmitKycAsync(Guid userId, KycSubmitDto dto);

    /// <summary>
    /// Returns metadata for the user's most recent KYC submission.
    /// </summary>
    Task<ApiResponse<object>> GetKycStatusAsync(Guid userId);

    /// <summary>
    /// Returns the raw document bytes and content-type for the user's latest KYC submission.
    /// </summary>
    Task<(byte[] Data, string ContentType, string FileName)?> GetKycDocumentAsync(Guid userId);

    /// <summary>
    /// Resolves an email address to a userId — used by the transfer flow.
    /// </summary>
    Task<ApiResponse<object>> LookupUserByEmailAsync(string email);
}
