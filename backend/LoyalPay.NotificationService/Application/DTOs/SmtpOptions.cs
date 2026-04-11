namespace LoyalPay.NotificationService.Application.DTOs;

public class SmtpOptions
{
    public string Host { get; set; } = "smtp.gmail.com";
    public int Port { get; set; } = 587;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromEmail { get; set; } = "noreply@loyalpay.com";
    public string FromName { get; set; } = "LoyalPay";
    public bool EnableSsl { get; set; } = true;
}
