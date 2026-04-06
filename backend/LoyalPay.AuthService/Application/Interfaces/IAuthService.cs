using LoyalPay.AuthService.Application.DTOs;
using LoyalPay.Shared.Events;
using LoyalPay.Shared.Common;

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
    /// Uses the same outward response for existing and non-existing emails.
    /// </summary>
    /// <returns>Generic success text; active users also get a temporary password in this environment.</returns>

    Task<ApiResponse<string>> ForgotPasswordAsync(ForgotPasswordDto dto);
    Task<ApiResponse<object>> GetProfileAsync(Guid userId);

    /// <summary>
    /// Persists KYC metadata and stores the submitted document under wwwroot/kyc.
    /// </summary>

    Task<ApiResponse<string>> SubmitKycAsync(Guid userId, KycSubmitDto dto);
}
