namespace LoyalPay.Shared.Common;

/// <summary>
/// Standard response envelope used by every endpoint across all services.
/// </summary>
/// <typeparam name="T">The type of the payload returned in <see cref="Data"/>.</typeparam>
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }

    /// <summary>
    /// Creates a successful response with the given payload and an optional message.
    /// </summary>
    public static ApiResponse<T> Ok(T data, string message = "Success")
    {
        return new ApiResponse<T>
        {
            Success = true,
            Message = message,
            Data    = data
        };
    }

    /// <summary>
    /// Creates a failed response with no payload and the provided error message.
    /// </summary>
    public static ApiResponse<T> Fail(string message)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Message = message
        };
    }
}
