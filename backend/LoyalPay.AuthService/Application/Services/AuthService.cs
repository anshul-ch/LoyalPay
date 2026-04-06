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

    public AuthService(IUserRepository userRepository, IRefreshTokenRepository refreshTokenRepository, 
        IKycSubmissionRepository kycSubmissionRepository, IJwtHelper jwtHelper, IPublishEndpoint publishEndpoint)
    {
        _userRepository = userRepository;
        _refreshTokenRepository = refreshTokenRepository;
        _kycSubmissionRepository = kycSubmissionRepository;
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

        await _refreshTokenRepository.AddRefreshTokenAsync(refreshTokenEntity);
        await _refreshTokenRepository.SaveChangesAsync();

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
        var alreadyExists = await _userRepository.UserExistsAsync(dto.Email);
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

        await _userRepository.AddUserAsync(user);
        await _userRepository.SaveChangesAsync();

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

        if (storedToken == null)
        {
            return ApiResponse<TokenDto>.Fail("Session expired. Please log in again.");
        }

        if (storedToken.ExpiresAt < DateTime.UtcNow)
        {
            return ApiResponse<TokenDto>.Fail("Session expired. Please log in again.");
        }

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

        // Same response for every email prevents account enumeration.

        const string safeMessage = "If an account with that email exists, a temporary password has been sent.";

        if (user == null || !user.IsActive)
        {
            return ApiResponse<string>.Ok(safeMessage);
        }

        var tempPassword = Convert.ToBase64String(Guid.NewGuid().ToByteArray())[..12];
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword);

        var activeTokens = await _refreshTokenRepository.GetActiveTokensByUserIdAsync(user.UserId);
        foreach (var token in activeTokens)
        {
            token.IsRevoked = true;
        }

        await _userRepository.SaveChangesAsync();
        await _refreshTokenRepository.SaveChangesAsync();

        return ApiResponse<string>.Ok($"Temporary password: {tempPassword}", safeMessage);
    }

    public async Task<ApiResponse<object>> GetProfileAsync(Guid userId)
    {
        var user = await _userRepository.GetUserByIdAsync(userId);
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
        var user = await _userRepository.GetUserByIdAsync(userId);
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
        await _kycSubmissionRepository.AddKycSubmissionAsync(submission);

        await _userRepository.SaveChangesAsync();
        return ApiResponse<string>.Ok("KYC submitted. It will be reviewed shortly.");
    }
}
