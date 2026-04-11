using LoyalPay.AuthService.Data;
using LoyalPay.AuthService.DTOs;
using LoyalPay.AuthService.Models;
using LoyalPay.Shared.Common;
using LoyalPay.Shared.Events;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.AuthService.Services;

public class AuthService
{
    private readonly AuthDbContext _db;
    private readonly JwtHelper _jwtHelper;
    private readonly IPublishEndpoint _publishEndpoint;

    public AuthService(AuthDbContext db, JwtHelper jwtHelper, IPublishEndpoint publishEndpoint)
    {
        _db = db;
        _jwtHelper = jwtHelper;
        _publishEndpoint = publishEndpoint;
    }

    private async Task<TokenDto> IssueTokensAsync(User user)
    {
        var accessToken = _jwtHelper.CreateAccessToken(user);
        var refreshToken = _jwtHelper.CreateRefreshToken();

        var refreshTokenEntity = new RefreshToken();
        refreshTokenEntity.UserId = user.UserId;
        refreshTokenEntity.Token = refreshToken;
        refreshTokenEntity.ExpiresAt = DateTime.UtcNow.AddDays(_jwtHelper.RefreshExpiryDays);
        refreshTokenEntity.IsRevoked = false;

        _db.RefreshTokens.Add(refreshTokenEntity);
        await _db.SaveChangesAsync();

        var tokenDto = new TokenDto();
        tokenDto.AccessToken = accessToken;
        tokenDto.RefreshToken = refreshToken;
        tokenDto.Email = user.Email;
        tokenDto.Role = user.Role;
        tokenDto.UserId = user.UserId;

        return tokenDto;
    }

    public async Task<ApiResponse<TokenDto>> SignupAsync(SignupDto dto)
    {
        var alreadyExists = await _db.Users.AnyAsync(u => u.Email == dto.Email);
        if (alreadyExists)
        {
            return ApiResponse<TokenDto>.Fail("This email is already registered.");
        }

        var user = new User();
        user.FullName = dto.FullName;
        user.Email = dto.Email;
        user.Phone = dto.Phone;
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        user.Role = "User";
        user.IsActive = true;
        user.KycStatus = "Pending";

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        await _publishEndpoint.Publish(new UserRegisteredEvent(user.UserId));

        var tokens = await IssueTokensAsync(user);
        return ApiResponse<TokenDto>.Ok(tokens, "Account created successfully!");
    }

    public async Task<ApiResponse<TokenDto>> LoginAsync(LoginDto dto)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (user == null)
        {
            return ApiResponse<TokenDto>.Fail("Invalid email or password.");
        }

        var passwordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
        if (!passwordValid)
        {
            return ApiResponse<TokenDto>.Fail("Invalid email or password.");
        }

        if (!user.IsActive)
        {
            return ApiResponse<TokenDto>.Fail("This account has been deactivated.");
        }

        var activeTokens = await _db.RefreshTokens
            .Where(t => t.UserId == user.UserId && !t.IsRevoked)
            .ToListAsync();

        foreach (var token in activeTokens)
        {
            token.IsRevoked = true;
        }

        await _db.SaveChangesAsync();

        var tokens = await IssueTokensAsync(user);
        return ApiResponse<TokenDto>.Ok(tokens);
    }

    public async Task<ApiResponse<TokenDto>> RefreshAsync(string refreshToken)
    {
        var storedToken = await _db.RefreshTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == refreshToken && !t.IsRevoked);

        if (storedToken == null)
        {
            return ApiResponse<TokenDto>.Fail("Session expired. Please log in again.");
        }

        if (storedToken.ExpiresAt < DateTime.UtcNow)
        {
            return ApiResponse<TokenDto>.Fail("Session expired. Please log in again.");
        }

        storedToken.IsRevoked = true;
        await _db.SaveChangesAsync();

        var tokens = await IssueTokensAsync(storedToken.User);
        return ApiResponse<TokenDto>.Ok(tokens);
    }

    public async Task LogoutAsync(string refreshToken)
    {
        var storedToken = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.Token == refreshToken);
        if (storedToken != null)
        {
            storedToken.IsRevoked = true;
            await _db.SaveChangesAsync();
        }
    }

    public async Task<ApiResponse<object>> GetProfileAsync(Guid userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null)
        {
            return ApiResponse<object>.Fail("User not found.");
        }

        var responseData = new
        {
            user.UserId,
            user.FullName,
            user.Email,
            user.Phone,
            user.Role,
            user.KycStatus,
            user.KycDocumentType,
            user.IsActive,
            user.CreatedAt
        };

        return ApiResponse<object>.Ok(responseData);
    }

    public async Task<ApiResponse<string>> SubmitKycAsync(Guid userId, KycSubmitDto dto)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null)
        {
            return ApiResponse<string>.Fail("User not found.");
        }

        if (user.KycStatus == "Approved")
        {
            return ApiResponse<string>.Fail("KYC is already approved.");
        }

        var folder = Path.Combine("wwwroot", "kyc");
        Directory.CreateDirectory(folder);

        var safeDocType = dto.DocumentType.Replace(" ", "_");
        var fileName = userId + "_" + safeDocType + "_" + DateTimeOffset.UtcNow.ToUnixTimeSeconds() + ".jpg";
        var filePath = Path.Combine(folder, fileName);

        var fileBytes = Convert.FromBase64String(dto.FileBase64);
        await File.WriteAllBytesAsync(filePath, fileBytes);

        user.KycDocumentType = dto.DocumentType;
        user.KycDocumentNumber = dto.DocumentNumber;
        user.KycFilePath = filePath;
        user.KycStatus = "Pending";

        var submission = new KycSubmission();
        submission.UserId = userId;
        submission.DocumentType = dto.DocumentType;
        submission.DocumentNumber = dto.DocumentNumber;
        submission.FilePath = filePath;
        submission.Status = "Pending";
        _db.KycSubmissions.Add(submission);

        await _db.SaveChangesAsync();
        return ApiResponse<string>.Ok("KYC submitted. It will be reviewed shortly.");
    }
}
