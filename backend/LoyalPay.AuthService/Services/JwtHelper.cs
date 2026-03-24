using LoyalPay.AuthService.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace LoyalPay.AuthService.Services;

public class JwtHelper
{
    private readonly string _secret;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly int _expiryMinutes;
    private readonly int _refreshExpiryDays;

    public JwtHelper(IConfiguration configuration)
    {
        _secret = configuration["JWT_SECRET"] ?? configuration["JwtSettings:Secret"] ?? string.Empty;
        _issuer = configuration["JWT_ISSUER"] ?? configuration["JwtSettings:Issuer"] ?? string.Empty;
        _audience = configuration["JWT_AUDIENCE"] ?? configuration["JwtSettings:Audience"] ?? string.Empty;

        if (string.IsNullOrWhiteSpace(_secret) || _secret.Length < 32)
        {
            throw new InvalidOperationException("JWT secret is missing or too short. Use JWT_SECRET with at least 32 characters.");
        }

        if (string.IsNullOrWhiteSpace(_issuer))
        {
            throw new InvalidOperationException("JWT issuer is missing. Use JWT_ISSUER.");
        }

        if (string.IsNullOrWhiteSpace(_audience))
        {
            throw new InvalidOperationException("JWT audience is missing. Use JWT_AUDIENCE.");
        }

        var expiryMinutesValue = configuration["JwtSettings:ExpiryMinutes"] ?? "60";
        var refreshExpiryDaysValue = configuration["JwtSettings:RefreshExpiryDays"] ?? "7";

        _expiryMinutes = int.Parse(expiryMinutesValue);
        _refreshExpiryDays = int.Parse(refreshExpiryDaysValue);
    }

    public string CreateAccessToken(User user)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_expiryMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string CreateRefreshToken()
    {
        var bytes = new byte[64];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes);
    }

    public int RefreshExpiryDays => _refreshExpiryDays;
}
