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
    private readonly ISupportTicketRepository _ticketRepository;
    private readonly IJwtHelper _jwtHelper;
    private readonly IPublishEndpoint _publishEndpoint;

    public AuthService(
        IUserRepository userRepository,
        IRefreshTokenRepository refreshTokenRepository,
        IKycSubmissionRepository kycSubmissionRepository,
        ISupportTicketRepository ticketRepository,
        IJwtHelper jwtHelper,
        IPublishEndpoint publishEndpoint)
    {
        _userRepository = userRepository;
        _refreshTokenRepository = refreshTokenRepository;
        _kycSubmissionRepository = kycSubmissionRepository;
        _ticketRepository = ticketRepository;
        _jwtHelper = jwtHelper;
        _publishEndpoint = publishEndpoint;
    }

    private static string NormalizeKycStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
        {
            return "NotSubmitted";
        }

        return status switch
        {
            "not_submitted" => "NotSubmitted",
            "pending" => "Pending",
            "approved" => "Approved",
            "rejected" => "Rejected",
            _ => status
        };
    }

    private static string GetTicketPriority(string category) => category switch
    {
        "AccountAccess" => "High",
        "PinReset" => "High",
        "PaymentIssue" => "High",
        "TransactionDispute" => "High",
        "KycProblem" => "Medium",
        "Rewards" => "Low",
        _ => "Medium"
    };

    private static string BuildDeactivationMessage(string? inactiveReason)
    {
        if (string.IsNullOrWhiteSpace(inactiveReason))
        {
            return "Your account has been deactivated. Please contact support.";
        }

        return $"Your account has been deactivated. Reason : {inactiveReason} Please contact support.";
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
            UserId = user.UserId,
            RequiresPasswordChange = user.MustChangePassword
        };
    }

    public async Task<ApiResponse<TokenDto>> SignupAsync(SignupDto dto)
    {
        var alreadyExists = await _userRepository.UserExistsAsync(dto.Email);
        if (alreadyExists)
        {
            return ApiResponse<TokenDto>.Fail("This email is already registered.");
        }

        var phoneExists = await _userRepository.PhoneExistsAsync(dto.Phone);
        if (phoneExists)
        {
            return ApiResponse<TokenDto>.Fail("This phone number is already registered.");
        }

        var user = new User
        {
            FullName = dto.FullName,
            Email = dto.Email,
            Phone = dto.Phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password, workFactor: 10),
            Role = "User",
            IsActive = true,
            KycStatus = "NotSubmitted"
        };

        await _userRepository.AddUserAsync(user);
        await _userRepository.SaveChangesAsync();

        // Notify WalletService and RewardsService to create accounts for this user.
        try { await _publishEndpoint.Publish(new UserRegisteredEvent(user.UserId, user.Email, user.FullName)); } catch { /* messaging failure is non-critical */ }

        var tokens = await IssueTokensAsync(user);
        return ApiResponse<TokenDto>.Ok(tokens, "Account created successfully!");
    }

    public async Task<ApiResponse<TokenDto>> LoginAsync(LoginDto dto, string? userAgent = null)
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
            return ApiResponse<TokenDto>.Fail(BuildDeactivationMessage(user.InactiveReason));
        }

        // Revoke all existing sessions on new login (single-session policy).
        var activeTokens = await _refreshTokenRepository.GetActiveTokensByUserIdAsync(user.UserId);
        foreach (var token in activeTokens)
        {
            token.IsRevoked = true;
        }

        await _refreshTokenRepository.SaveChangesAsync();

        var (browser, os) = ParseUserAgent(userAgent);
        var tokens = await IssueTokensAsync(user);
        try { await _publishEndpoint.Publish(new UserLoggedInEvent(user.UserId, user.Email, user.FullName, DateTime.UtcNow, browser, os)); } catch { /* messaging failure is non-critical */ }
        return ApiResponse<TokenDto>.Ok(tokens);
    }

    private static (string? Browser, string? Os) ParseUserAgent(string? userAgent)
    {
        if (string.IsNullOrWhiteSpace(userAgent)) return (null, null);

        string? browser = null;
        string? os = null;

        // Browser detection — order matters (Edge before Chrome, Chrome before Safari)
        if (userAgent.Contains("Edg/")) browser = "Microsoft Edge";
        else if (userAgent.Contains("OPR/") || userAgent.Contains("Opera")) browser = "Opera";
        else if (userAgent.Contains("Chrome/")) browser = "Chrome";
        else if (userAgent.Contains("Firefox/")) browser = "Firefox";
        else if (userAgent.Contains("Safari/") && !userAgent.Contains("Chrome")) browser = "Safari";

        // OS detection
        if (userAgent.Contains("Windows NT")) os = "Windows";
        else if (userAgent.Contains("Mac OS X")) os = "macOS";
        else if (userAgent.Contains("Android")) os = "Android";
        else if (userAgent.Contains("iPhone") || userAgent.Contains("iPad")) os = "iOS";
        else if (userAgent.Contains("Linux")) os = "Linux";

        return (browser, os);
    }

    public async Task<ApiResponse<TokenDto>> RefreshAsync(string refreshToken)
    {
        var storedToken = await _refreshTokenRepository.GetRefreshTokenWithUserAsync(refreshToken);

        if (storedToken == null || storedToken.IsRevoked)
        {
            return ApiResponse<TokenDto>.Fail("Session expired. Please log in again.");
        }

        if (!storedToken.User.IsActive)
        {
            return ApiResponse<TokenDto>.Fail(BuildDeactivationMessage(storedToken.User.InactiveReason));
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
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword, workFactor: 10);
        user.MustChangePassword = true;

        // Invalidate all active sessions so the old password can't be reused.
        var activeTokens = await _refreshTokenRepository.GetActiveTokensByUserIdAsync(user.UserId);
        foreach (var token in activeTokens)
        {
            token.IsRevoked = true;
        }

        await _userRepository.SaveChangesAsync();
        await _refreshTokenRepository.SaveChangesAsync();

        try
        {
            await _publishEndpoint.Publish(new ForgotPasswordIssuedEvent(
                user.UserId,
                user.Email,
                user.FullName,
                tempPassword,
                DateTime.UtcNow));
        }
        catch { /* messaging failure is non-critical */ }

        return ApiResponse<string>.Ok(safeMessage);
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
            KycStatus = NormalizeKycStatus(user.KycStatus),
            user.KycDocumentType,
            user.InactiveReason,
            user.IsActive,
            user.CreatedAt,
            HasPin = !string.IsNullOrEmpty(user.TransactionPinHash),
            user.MustResetPin
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
            KycStatus = NormalizeKycStatus(user.KycStatus),
            user.IsActive,
            user.InactiveReason
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

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword, workFactor: 10);
        user.MustChangePassword = false;

        // Revoke all sessions so the user must log in again with the new password.
        var activeTokens = await _refreshTokenRepository.GetActiveTokensByUserIdAsync(userId);
        foreach (var token in activeTokens)
        {
            token.IsRevoked = true;
        }

        await _userRepository.SaveChangesAsync();
        await _refreshTokenRepository.SaveChangesAsync();

        try
        {
            await _publishEndpoint.Publish(new UserNotificationRequestedEvent(
                userId,
                "Security",
                "Password changed",
                "Your account password was changed successfully. If this was not you, contact support immediately.",
                DateTime.UtcNow));
        }
        catch { /* messaging failure is non-critical */ }

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

        // Accept both raw base64 and data URLs (data:<mime>;base64,<payload>).
        var contentType = "application/octet-stream";
        var base64Payload = dto.FileBase64;

        if (dto.FileBase64.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
        {
            var commaIndex = dto.FileBase64.IndexOf(',');
            if (commaIndex < 0)
            {
                return ApiResponse<string>.Fail("Invalid file data. Please provide a valid base64-encoded file.");
            }

            var metadata = dto.FileBase64[5..commaIndex];
            var semicolonIndex = metadata.IndexOf(';');
            if (semicolonIndex > 0)
            {
                contentType = metadata[..semicolonIndex];
            }

            base64Payload = dto.FileBase64[(commaIndex + 1)..];
        }

        // Decode the base64 document and store it directly in the database.
        byte[] fileBytes;
        try
        {
            fileBytes = Convert.FromBase64String(base64Payload);
        }
        catch
        {
            return ApiResponse<string>.Fail("Invalid file data. Please provide a valid base64-encoded file.");
        }

        var extension = contentType switch
        {
            "image/png" => ".png",
            "image/webp" => ".webp",
            "application/pdf" => ".pdf",
            _ => ".jpg"
        };

        // Derive a safe filename from the document type and a timestamp.
        var safeDocType = dto.DocumentType.Replace(" ", "_");
        var fileName = $"{userId}_{safeDocType}_{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}{extension}";

        var submission = new KycSubmission
        {
            UserId = userId,
            DocumentType = dto.DocumentType,
            DocumentNumber = dto.DocumentNumber,
            FileData = fileBytes,
            FileName = fileName,
            ContentType = contentType,
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
            return ApiResponse<object>.Ok(new
            {
                Status = "NotSubmitted"
            });
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
        if (submission == null || submission.FileData == null || submission.FileData.Length == 0)
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

        return ApiResponse<object>.Ok(new
        {
            user.UserId,
            user.FullName,
            user.Email
        });
    }

    // ── Transaction PIN ────────────────────────────────────────────────────────

    public async Task<ApiResponse<string>> SetTransactionPinAsync(Guid userId, string pin)
    {
        var user = await _userRepository.GetUserByIdAsync(userId);
        if (user == null)
            return ApiResponse<string>.Fail("User not found.");

        // Allow setting PIN if MustResetPin is true (after support reset) or if no PIN exists
        if (!string.IsNullOrEmpty(user.TransactionPinHash) && !user.MustResetPin)
            return ApiResponse<string>.Fail("Transaction PIN is already set. Contact support if you need a reset.");

        if (string.IsNullOrWhiteSpace(pin) || pin.Length != 5 || !pin.All(char.IsDigit))
            return ApiResponse<string>.Fail("PIN must be exactly 5 digits.");

        user.TransactionPinHash = BCrypt.Net.BCrypt.HashPassword(pin, workFactor: 10);
        user.MustResetPin = false; // Clear the flag after successful PIN set
        await _userRepository.SaveChangesAsync();

        return ApiResponse<string>.Ok("Transaction PIN set successfully.");
    }

    public async Task<ApiResponse<bool>> VerifyTransactionPinAsync(Guid userId, string pin)
    {
        var user = await _userRepository.GetUserByIdAsync(userId);
        if (user == null)
            return ApiResponse<bool>.Fail("User not found.");

        if (string.IsNullOrEmpty(user.TransactionPinHash))
            return ApiResponse<bool>.Ok(false, "No PIN set.");

        var valid = BCrypt.Net.BCrypt.Verify(pin, user.TransactionPinHash);
        return ApiResponse<bool>.Ok(valid, valid ? "PIN verified." : "Incorrect PIN.");
    }

    public async Task<ApiResponse<bool>> GetPinStatusAsync(Guid userId)
    {
        var user = await _userRepository.GetUserByIdAsync(userId);
        if (user == null)
            return ApiResponse<bool>.Fail("User not found.");

        return ApiResponse<bool>.Ok(!string.IsNullOrEmpty(user.TransactionPinHash));
    }

    public async Task<ApiResponse<string>> ChangeTransactionPinAsync(Guid userId, ChangePinDto dto)
    {
        var user = await _userRepository.GetUserByIdAsync(userId);
        if (user == null)
            return ApiResponse<string>.Fail("User not found.");

        if (string.IsNullOrWhiteSpace(user.TransactionPinHash))
            return ApiResponse<string>.Fail("No transaction PIN set. Please set PIN first.");

        if (dto.CurrentPin == dto.NewPin)
            return ApiResponse<string>.Fail("New PIN must be different from current PIN.");

        var isValidCurrentPin = BCrypt.Net.BCrypt.Verify(dto.CurrentPin, user.TransactionPinHash);
        if (!isValidCurrentPin)
            return ApiResponse<string>.Fail("Current PIN is incorrect.");

        user.TransactionPinHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPin, workFactor: 10);
        await _userRepository.SaveChangesAsync();

        return ApiResponse<string>.Ok("Transaction PIN changed successfully.");
    }

    public async Task<ApiResponse<string>> ResetTransactionPinAsync(Guid supportUserId, ResetUserPinDto dto)
    {
        // Validate support user
        var supportUser = await _userRepository.GetUserByIdAsync(supportUserId);
        if (supportUser == null || supportUser.Role != "Support")
            return ApiResponse<string>.Fail("Unauthorized.");

        // Validate the PIN reset ticket
        var ticket = await _ticketRepository.GetByIdAsync(dto.TicketId);
        if (ticket == null)
            return ApiResponse<string>.Fail("Ticket not found.");

        if (ticket.UserId != dto.UserId)
            return ApiResponse<string>.Fail("Ticket does not match the user.");

        if (ticket.Category != "PinReset")
            return ApiResponse<string>.Fail("This ticket is not a PIN reset request.");

        if (ticket.Status == "Resolved" || ticket.Status == "Closed")
            return ApiResponse<string>.Fail("This ticket is already resolved.");

        if (ticket.AssignedToUserId != supportUserId)
            return ApiResponse<string>.Fail("Only the assigned support agent can reset PIN for this ticket.");

        // Reset PIN to default 00000
        var user = await _userRepository.GetUserByIdAsync(dto.UserId);
        if (user == null)
            return ApiResponse<string>.Fail("Target user not found.");

        // Hash default PIN "00000"
        user.TransactionPinHash = BCrypt.Net.BCrypt.HashPassword("00000", workFactor: 10);
        user.MustResetPin = true; // Allow user to set their own PIN

        // Resolve the ticket
        ticket.Status = "Resolved";
        ticket.Resolution = "Transaction PIN reset by support agent to default (00000). User can now set their own PIN.";
        ticket.ResolvedAt = DateTime.UtcNow;
        ticket.UpdatedAt = DateTime.UtcNow;

        await _userRepository.SaveChangesAsync();
        await _ticketRepository.SaveChangesAsync();

        // Notify user via email
        try
        {
            await _publishEndpoint.Publish(new SupportTicketUpdatedEvent(
                ticket.TicketId,
                ticket.TicketNumber,
                ticket.UserId,
                user.Email,
                user.FullName,
                ticket.Category,
                ticket.Subject,
                "Resolved",
                ticket.Resolution,
                supportUserId,
                DateTime.UtcNow));
        }
        catch { /* messaging failure is non-critical */ }

        return ApiResponse<string>.Ok("Transaction PIN reset to default. User can now set their own PIN from their profile.");
    }

    // ── Support Tickets ────────────────────────────────────────────────────────

    public async Task<ApiResponse<object>> CreateTicketAsync(Guid userId, CreateTicketDto dto)
    {
        var user = await _userRepository.GetUserByIdAsync(userId);
        if (user == null)
            return ApiResponse<object>.Fail("User not found.");

        var ticketNumber = await _ticketRepository.GetNextTicketNumberAsync();

        var ticket = new SupportTicket
        {
            TicketNumber = $"LP-{ticketNumber:D5}",
            UserId = userId,
            Category = dto.Category,
            Subject = dto.Subject.Trim(),
            Description = dto.Description.Trim(),
            Status = "Open",
            Priority = GetTicketPriority(dto.Category),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _ticketRepository.AddAsync(ticket);
        await _ticketRepository.SaveChangesAsync();

        var result = new
        {
            ticket.TicketId,
            ticket.TicketNumber,
            ticket.Category,
            ticket.Subject,
            ticket.Description,
            ticket.Status,
            ticket.Priority,
            ticket.CreatedAt
        };

        return ApiResponse<object>.Ok(result, "Support ticket created successfully.");
    }

    public async Task<ApiResponse<object>> CreatePublicTicketAsync(CreatePublicTicketDto dto)
    {
        var user = await _userRepository.GetUserByEmailAsync(dto.Email);
        if (user == null)
        {
            return ApiResponse<object>.Fail("No account found with that email address.");
        }

        var ticketNumber = await _ticketRepository.GetNextTicketNumberAsync();
        var subject = $"[{dto.Category.Trim()}] {dto.ReasonType.Trim()}";
        var description = $"Requester email: {dto.Email.Trim()}\n\n{dto.Description.Trim()}";

        var ticket = new SupportTicket
        {
            TicketNumber = $"LP-{ticketNumber:D5}",
            UserId = user.UserId,
            Category = dto.Category,
            Subject = subject,
            Description = description,
            Status = "Open",
            Priority = GetTicketPriority(dto.Category),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _ticketRepository.AddAsync(ticket);
        await _ticketRepository.SaveChangesAsync();

        var result = new
        {
            ticket.TicketId,
            ticket.TicketNumber,
            ticket.Category,
            ticket.Subject,
            ticket.Description,
            ticket.Status,
            ticket.Priority,
            ticket.CreatedAt
        };

        return ApiResponse<object>.Ok(result, "Support ticket submitted. An agent will review your account status.");
    }

    public async Task<ApiResponse<object>> GetMyTicketsAsync(Guid userId)
    {
        var tickets = await _ticketRepository.GetByUserIdAsync(userId);

        var data = tickets.Select(t => new
        {
            t.TicketId,
            t.TicketNumber,
            t.Category,
            t.Subject,
            t.Status,
            t.Priority,
            t.Resolution,
            t.CreatedAt,
            t.UpdatedAt,
            t.ResolvedAt
        }).ToList();

        return ApiResponse<object>.Ok(data);
    }

    public async Task<ApiResponse<object>> GetAllTicketsAsync(int page, int size, string? status, string? category, Guid? assignedTo)
    {
        if (page < 1) page = 1;
        if (size < 1) size = 20;

        var tickets = await _ticketRepository.GetAllAsync(page, size, status, category, assignedTo);
        var total = await _ticketRepository.GetTotalCountAsync(status, category, assignedTo);

        var data = tickets.Select(t => new
        {
            t.TicketId,
            t.TicketNumber,
            t.Category,
            t.Subject,
            t.Status,
            t.Priority,
            t.AssignedToUserId,
            t.Resolution,
            t.CreatedAt,
            t.UpdatedAt,
            t.ResolvedAt,
            User = t.User == null ? null : new { t.User.UserId, t.User.FullName, t.User.Email }
        }).ToList();

        return ApiResponse<object>.Ok(new
        {
            Items = data,
            Total = total,
            Page = page,
            Size = size,
            TotalPages = (int)Math.Ceiling(total / (double)size)
        });
    }

    public async Task<ApiResponse<object>> GetTicketByIdAsync(Guid ticketId)
    {
        var ticket = await _ticketRepository.GetByIdAsync(ticketId);
        if (ticket == null)
            return ApiResponse<object>.Fail("Ticket not found.");

        var data = new
        {
            ticket.TicketId,
            ticket.TicketNumber,
            ticket.Category,
            ticket.Subject,
            ticket.Description,
            ticket.Status,
            ticket.Priority,
            ticket.AssignedToUserId,
            ticket.Resolution,
            ticket.CreatedAt,
            ticket.UpdatedAt,
            ticket.ResolvedAt,
            User = ticket.User == null ? null : new { ticket.User.UserId, ticket.User.FullName, ticket.User.Email }
        };

        return ApiResponse<object>.Ok(data);
    }

    public async Task<ApiResponse<string>> UpdateTicketAsync(Guid ticketId, UpdateTicketDto dto, Guid agentUserId)
    {
        var ticket = await _ticketRepository.GetByIdAsync(ticketId);
        if (ticket == null)
            return ApiResponse<string>.Fail("Ticket not found.");

        var actor = await _userRepository.GetUserByIdAsync(agentUserId);
        if (actor == null || (actor.Role != "Admin" && actor.Role != "Support"))
            return ApiResponse<string>.Fail("Unauthorized.");

        if (actor.Role == "Support" && ticket.AssignedToUserId != agentUserId)
            return ApiResponse<string>.Fail("Only the assigned support agent can update this ticket.");

        var validStatuses = new[] { "Open", "InProgress", "Resolved", "Closed" };
        if (!validStatuses.Contains(dto.Status))
            return ApiResponse<string>.Fail("Invalid status.");

        if (!string.IsNullOrWhiteSpace(dto.Priority))
        {
            if (actor.Role != "Admin")
                return ApiResponse<string>.Fail("Only admin can change ticket priority.");

            var validPriorities = new[] { "Low", "Medium", "High" };
            if (!validPriorities.Contains(dto.Priority))
                return ApiResponse<string>.Fail("Invalid priority.");
            ticket.Priority = dto.Priority;
        }

        var prevStatus = ticket.Status;
        ticket.Status = dto.Status;
        ticket.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(dto.Resolution))
            ticket.Resolution = dto.Resolution.Trim();

        if (dto.Status == "Resolved" && ticket.ResolvedAt == null)
            ticket.ResolvedAt = DateTime.UtcNow;

        await _ticketRepository.SaveChangesAsync();

        // If resolved, send email notification to user
        if (dto.Status == "Resolved" && prevStatus != "Resolved")
        {
            var user = await _userRepository.GetUserByIdAsync(ticket.UserId);
            if (user != null)
            {
                try
                {
                    await _publishEndpoint.Publish(new SupportTicketUpdatedEvent(
                        ticket.TicketId,
                        ticket.TicketNumber,
                        ticket.UserId,
                        user.Email,
                        user.FullName,
                        ticket.Category,
                        ticket.Subject,
                        dto.Status,
                        ticket.Resolution,
                        agentUserId,
                        DateTime.UtcNow));
                }
                catch { /* messaging failure is non-critical */ }
            }
        }

        return ApiResponse<string>.Ok("Ticket updated successfully.");
    }

    public async Task<ApiResponse<string>> AssignTicketAsync(Guid ticketId, Guid supportAgentId, Guid adminUserId)
    {
        var ticket = await _ticketRepository.GetByIdAsync(ticketId);
        if (ticket == null)
            return ApiResponse<string>.Fail("Ticket not found.");

        var agent = await _userRepository.GetUserByIdAsync(supportAgentId);
        if (agent == null || agent.Role != "Support")
            return ApiResponse<string>.Fail("Invalid support agent.");

        ticket.AssignedToUserId = supportAgentId;
        ticket.Status = ticket.Status == "Open" ? "InProgress" : ticket.Status;
        ticket.UpdatedAt = DateTime.UtcNow;

        await _ticketRepository.SaveChangesAsync();

        return ApiResponse<string>.Ok($"Ticket assigned to {agent.FullName}.");
    }

    public async Task<ApiResponse<string>> RequestTicketOwnershipAsync(Guid ticketId, Guid supportUserId, string? reason)
    {
        var requester = await _userRepository.GetUserByIdAsync(supportUserId);
        if (requester == null || requester.Role != "Support")
            return ApiResponse<string>.Fail("Unauthorized.");

        var ticket = await _ticketRepository.GetByIdAsync(ticketId);
        if (ticket == null)
            return ApiResponse<string>.Fail("Ticket not found.");

        if (ticket.AssignedToUserId == supportUserId)
            return ApiResponse<string>.Fail("Ticket is already assigned to you.");

        var requestNote = $"[Ownership Request] {requester.FullName} requested assignment";
        if (!string.IsNullOrWhiteSpace(reason))
            requestNote += $": {reason.Trim()}";

        ticket.Resolution = string.IsNullOrWhiteSpace(ticket.Resolution)
            ? requestNote
            : $"{ticket.Resolution}\n{requestNote}";
        ticket.UpdatedAt = DateTime.UtcNow;

        await _ticketRepository.SaveChangesAsync();
        return ApiResponse<string>.Ok("Ownership request submitted. Admin approval required.");
    }

    // ── Support Agent Management ───────────────────────────────────────────────

    public async Task<ApiResponse<string>> CreateSupportAgentAsync(CreateSupportAgentDto dto, Guid adminUserId)
    {
        var exists = await _userRepository.UserExistsAsync(dto.Email);
        if (exists)
            return ApiResponse<string>.Fail("An account with this email already exists.");

        var phoneExists = await _userRepository.PhoneExistsAsync(dto.Phone);
        if (phoneExists)
            return ApiResponse<string>.Fail("An account with this phone number already exists.");

        var agent = new User
        {
            FullName = dto.FullName,
            Email = dto.Email,
            Phone = dto.Phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password, workFactor: 10),
            Role = "Support",
            IsActive = true,
            KycStatus = "Approved"
        };

        await _userRepository.AddUserAsync(agent);
        await _userRepository.SaveChangesAsync();

        return ApiResponse<string>.Ok($"Support agent '{dto.FullName}' created successfully.");
    }

    public async Task<ApiResponse<object>> GetSupportAgentsAsync()
    {
        // We need all Support-role users — extend user repo inline via a simple query
        // Since IUserRepository doesn't have GetByRole, we'll add a direct call
        var agents = await _userRepository.GetUsersByRoleAsync("Support");

        var data = agents.Select(a => new
        {
            a.UserId,
            a.FullName,
            a.Email,
            a.Phone,
            a.IsActive,
            a.CreatedAt
        }).ToList();

        return ApiResponse<object>.Ok(data);
    }

    // ── User Account Management ──────────────────────────────────

    public async Task<ApiResponse<string>> ActivateUserAsync(Guid userId, Guid adminUserId)
    {
        // Verify admin
        var admin = await _userRepository.GetUserByIdAsync(adminUserId);
        if (admin == null || (admin.Role != "Admin" && admin.Role != "Support"))
            return ApiResponse<string>.Fail("Unauthorized: Only admins or support agents can activate users.");

        var user = await _userRepository.GetUserByIdAsync(userId);
        if (user == null)
            return ApiResponse<string>.Fail("User not found.");

        if (user.IsActive)
            return ApiResponse<string>.Fail("User is already active.");

        user.IsActive = true;
        user.InactiveReason = null;
        await _userRepository.SaveChangesAsync();

        // Publish event for audit logging
        try { await _publishEndpoint.Publish(new UserActivatedEvent(userId, user.Email, user.FullName, DateTime.UtcNow)); } catch { /* messaging failure is non-critical */ }

        return ApiResponse<string>.Ok("User account has been activated successfully.");
    }

    public async Task<ApiResponse<string>> DeactivateUserAsync(Guid userId, string? reason, Guid adminUserId)
    {
        // Verify admin
        var admin = await _userRepository.GetUserByIdAsync(adminUserId);
        if (admin == null || admin.Role != "Admin")
            return ApiResponse<string>.Fail("Unauthorized: Only admins can deactivate users.");

        var user = await _userRepository.GetUserByIdAsync(userId);
        if (user == null)
            return ApiResponse<string>.Fail("User not found.");

        if (!user.IsActive)
            return ApiResponse<string>.Fail("User is already deactivated.");

        user.IsActive = false;
        user.InactiveReason = reason;
        await _userRepository.SaveChangesAsync();

        // Publish event for audit logging
        try { await _publishEndpoint.Publish(new UserDeactivatedEvent(userId, user.Email, user.FullName, reason, DateTime.UtcNow)); } catch { /* messaging failure is non-critical */ }

        return ApiResponse<string>.Ok("User account has been deactivated successfully.");
    }
}
