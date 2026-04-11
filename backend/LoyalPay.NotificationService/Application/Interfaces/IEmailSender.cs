namespace LoyalPay.NotificationService.Application.Interfaces;

public interface IEmailSender
{
    Task SendAsync(string toEmail, string? toName, string subject, string body);
}
