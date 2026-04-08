using LoyalPay.AuthService.Domain.Entities;

namespace LoyalPay.AuthService.Application.Interfaces;

public interface IJwtHelper
{
    /// <summary>
    /// Creates a signed JWT access token containing the user's id, email, and role claims.
    /// </summary>
    string CreateAccessToken(User user);

    /// <summary>
    /// Generates a cryptographically random opaque refresh token string.
    /// </summary>
    string CreateRefreshToken();

    /// <summary>
    /// Number of days before a refresh token expires, read from configuration.
    /// </summary>
    int RefreshExpiryDays { get; }
}
