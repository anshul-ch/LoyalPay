using LoyalPay.AuthService.Application.DTOs;
using LoyalPay.AuthService.Application.Interfaces;
using LoyalPay.AuthService.Domain.Entities;
using LoyalPay.AuthService.Domain.Interfaces;
using LoyalPay.Shared.Common;
using LoyalPay.Shared.Events;
using MassTransit;

namespace LoyalPay.AuthService.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly IKycSubmissionRepository _kycSubmissionRepository;
    private readonly IJwtHelper _jwtHelper;
    private readonly IPublishEndpoint _publishEndpoint;

    public AuthService(
        IUserRepository userRepository,
        IRefreshTokenRepository refreshTokenRepository,
        IKycSubmissionRepository kycSubmissionRepository,
        IJwtHelper jwtHelper,
        IPublishEndpoint publishEndpoint)
    {
        _userRepository = userRepository;
        _refreshTokenRepository = refreshTokenRepository;
        _kycSubmissionRepository = kycSubmissionRepository;
        _jwtHelper = jwtHelper;
        _publishEndpoint = publishEndpoint;
    }

    /// <summary>
    /// Creates a fresh access + refresh token pair and persists the refresh token.
    /// Called after every successful login, signup, or token refresh.
    /// </summary>
    private async Task<TokenDto> IssueTokensAsync(User user)
    {
        var accessToken = _jwtHelper.CreateAccessToken(user);
        var refreshToken = _jwtHelper.CreateRefreshToken();

        var refreshTokenEntity = new RefreshToken
        {
            UserId = user.UserId,
            Token = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtHelper.RefreshExpiryDays),
            IsRevoked = false
        };

        await _refreshTokenRepository.AddRefreshTokenAsync(refreshTokenEntity);
        await _refreshTokenRepository.SaveChangesAsync();

        return new TokenDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            Email = user.Email,
            FullName = user.FullName,
            Phone = user.Phone,
            Role = user.Role,
            UserId = user.UserId
        };
    }

    public async Task<ApiResponse<TokenDto>> SignupAsync(SignupDto dto)
    {
        var alreadyExists = await _userRepository.UserExistsAsync(dto.Email);
        if (alreadyExists)
        {
            return ApiResponse<TokenDto>.Fail("This email is already registered.");
        }

        var user = new User
        {
            FullName = dto.FullName,
            Email = dto.Email,
            Phone = dto.Phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = "User",
            IsActive = true,
            // KYC starts as not_submitted — user hasn't uploaded anything yet.
            KycStatus = "not_submitted"
        };

        await _userRepository.AddUserAsync(user);
        await _userRepository.SaveChangesAsync();

        // Notify WalletService and RewardsService to create accounts for this user.
        await _publishEndpoint.Publish(new UserRegisteredEvent(user.UserId));

        var tokens = await IssueTokensAsync(user);
        return ApiResponse<TokenDto>.Ok(tokens, "Account created successfully!");
    }

    public async Task<ApiResponse<TokenDto>> LoginAsync(LoginDto dto)
    {
        var user = await _userRepository.GetUserByEmailAsync(dto.Email);
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

        // Revoke all existing sessions on new login (single-session policy).
        var activeTokens = await _refreshTokenRepository.GetActiveTokensByUserIdAsync(user.UserId);
        foreach (var token in activeTokens)
        {
            token.IsRevoked = true;
        }

        await _refreshTokenRepository.SaveChangesAsync();

        var tokens = await IssueTokensAsync(user);
        return ApiResponse<TokenDto>.Ok(tokens);
    }

    public async Task<ApiResponse<TokenDto>> RefreshAsync(string refreshToken)
    {
        var storedToken = await _refreshTokenRepository.GetRefreshTokenWithUserAsync(refreshToken);

        if (storedToken == null || storedToken.IsRevoked)
        {
            return ApiResponse<TokenDto>.Fail("Session expired. Please log in again.");
        }

        if (storedToken.ExpiresAt < DateTime.UtcNow)
        {
            return ApiResponse<TokenDto>.Fail("Session expired. Please log in again.");
        }

        // Rotate: revoke the used token before issuing a new pair.
        storedToken.IsRevoked = true;
        await _refreshTokenRepository.SaveChangesAsync();

        var tokens = await IssueTokensAsync(storedToken.User);
        return ApiResponse<TokenDto>.Ok(tokens);
    }

    public async Task LogoutAsync(string refreshToken)
    {
        var storedToken = await _refreshTokenRepository.GetRefreshTokenAsync(refreshToken);
        if (storedToken != null)
        {
            storedToken.IsRevoked = true;
            await _refreshTokenRepository.SaveChangesAsync();
        }
    }

    public async Task<ApiResponse<string>> ForgotPasswordAsync(ForgotPasswordDto dto)
    {
        var user = await _userRepository.GetUserByEmailAsync(dto.Email);

        // Same response for every email — prevents account enumeration.
        const string safeMessage = "If an account with that email exists, a temporary password has been sent.";

        if (user == null || !user.IsActive)
        {
            return ApiResponse<string>.Ok(safeMessage);
        }

        var tempPassword = Convert.ToBase64String(Guid.NewGuid().ToByteArray())[..12];
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword);

        // Invalidate all active sessions so the old password can't be reused.
        var activeTokens = await _refreshTokenRepository.GetActiveTokensByUserIdAsync(user.UserId);
        foreach (var token in activeTokens)
        {
            token.IsRevoked = true;
        }

        await _userRepository.SaveChangesAsync();
        await _refreshTokenRepository.SaveChangesAsync();

        // TODO: In production, send tempPassword via email and return only safeMessage.
        return ApiResponse<string>.Ok($"Temporary password: {tempPassword}", safeMessage);
    }

    public async Task<ApiResponse<object>> GetProfileAsync(Guid userId)
    {
        var user = await _userRepository.GetUserByIdAsync(userId);
        if (user == null)
        {
            return ApiResponse<object>.Fail("User not found.");
        }

        var data = new
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

        return ApiResponse<object>.Ok(data);
    }

    public async Task<ApiResponse<object>> UpdateProfileAsync(Guid userId, UpdateProfileDto dto)
    {
        var user = await _userRepository.GetUserByIdAsync(userId);
        if (user == null)
        {
            return ApiResponse<object>.Fail("User not found.");
        }

        user.FullName = dto.FullName;
        user.Phone = dto.Phone;

        await _userRepository.SaveChangesAsync();

        var data = new
        {
            user.UserId,
            user.FullName,
            user.Email,
            user.Phone,
            user.Role,
            user.KycStatus
        };

        return ApiResponse<object>.Ok(data);
    }

    public async Task<ApiResponse<string>> ChangePasswordAsync(Guid userId, ChangePasswordDto dto)
    {
        var user = await _userRepository.GetUserByIdAsync(userId);
        if (user == null)
        {
            return ApiResponse<string>.Fail("User not found.");
        }

        if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
        {
            return ApiResponse<string>.Fail("Current password is incorrect.");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);

        // Revoke all sessions so the user must log in again with the new password.
        var activeTokens = await _refreshTokenRepository.GetActiveTokensByUserIdAsync(userId);
        foreach (var token in activeTokens)
        {
            token.IsRevoked = true;
        }

        await _userRepository.SaveChangesAsync();
        await _refreshTokenRepository.SaveChangesAsync();

        return ApiResponse<string>.Ok("Password changed successfully.");
    }

    public async Task<ApiResponse<string>> SubmitKycAsync(Guid userId, KycSubmitDto dto)
    {
        var user = await _userRepository.GetUserByIdAsync(userId);
        if (user == null)
        {
            return ApiResponse<string>.Fail("User not found.");
        }

        if (user.KycStatus == "Approved")
        {
            return ApiResponse<string>.Fail("KYC is already approved.");
        }

        // Decode the base64 document and store it directly in the database.
        byte[] fileBytes;
        try
        {
            fileBytes = Convert.FromBase64String(dto.FileBase64);
        }
        catch
        {
            return ApiResponse<string>.Fail("Invalid file data. Please provide a valid base64-encoded file.");
        }

        // Derive a safe filename from the document type and a timestamp.
        var safeDocType = dto.DocumentType.Replace(" ", "_");
        var fileName = $"{userId}_{safeDocType}_{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}.jpg";

        var submission = new KycSubmission
        {
            UserId = userId,
            DocumentType = dto.DocumentType,
            DocumentNumber = dto.DocumentNumber,
            FileData = fileBytes,
            FileName = fileName,
            ContentType = "image/jpeg",
            Status = "Pending"
        };

        await _kycSubmissionRepository.AddKycSubmissionAsync(submission);

        // Keep the denormalised fields on User in sync for quick status checks.
        user.KycDocumentType = dto.DocumentType;
        user.KycDocumentNumber = dto.DocumentNumber;
        user.KycStatus = "Pending";

        await _userRepository.SaveChangesAsync();
        await _kycSubmissionRepository.SaveChangesAsync();

        return ApiResponse<string>.Ok("KYC submitted. It will be reviewed shortly.");
    }

    public async Task<ApiResponse<object>> GetKycStatusAsync(Guid userId)
    {
        var submission = await _kycSubmissionRepository.GetLatestByUserIdAsync(userId);
        if (submission == null)
        {
            return ApiResponse<object>.Fail("No KYC submission found.");
        }

        var data = new
        {
            submission.SubmissionId,
            submission.DocumentType,
            submission.DocumentNumber,
            submission.FileName,
            submission.Status,
            submission.RejectionNote,
            submission.SubmittedAt,
            submission.ReviewedAt
        };

        return ApiResponse<object>.Ok(data);
    }

    public async Task<(byte[] Data, string ContentType, string FileName)?> GetKycDocumentAsync(Guid userId)
    {
        var submission = await _kycSubmissionRepository.GetLatestByUserIdAsync(userId);
        if (submission == null || submission.FileData.Length == 0)
        {
            return null;
        }

        return (submission.FileData, submission.ContentType, submission.FileName);
    }

    public async Task<ApiResponse<object>> LookupUserByEmailAsync(string email)
    {
        var user = await _userRepository.GetUserByEmailAsync(email);
        if (user == null || !user.IsActive)
        {
            return ApiResponse<object>.Fail("No active user found with that email.");
        }

        return ApiResponse<object>.Ok(new { user.UserId });
    }
}
