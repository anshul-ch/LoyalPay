using LoyalPay.AuthService.Domain.Entities;

namespace LoyalPay.AuthService.Application.Interfaces;

public interface IJwtHelper
{
    string CreateAccessToken(User user);
    string CreateRefreshToken();
    int RefreshExpiryDays { get; }
}
