using LoyalPay.NotificationService.Application.DTOs;
using LoyalPay.NotificationService.Application.Interfaces;
using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Mail;

namespace LoyalPay.NotificationService.Infrastructure.Email;

public class SmtpEmailSender : IEmailSender
{
    private readonly SmtpOptions _options;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(IOptions<SmtpOptions> options, ILogger<SmtpEmailSender> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task SendAsync(string toEmail, string? toName, string subject, string body)
    {
        if (string.IsNullOrWhiteSpace(_options.Username) || string.IsNullOrWhiteSpace(_options.Password))
        {
            _logger.LogWarning("SMTP credentials are not configured. Skipping email send to {Email}", toEmail);
            return;
        }

        using var client = new SmtpClient(_options.Host, _options.Port)
        {
            EnableSsl = _options.EnableSsl,
            Credentials = new NetworkCredential(_options.Username, _options.Password)
        };

        var from = new MailAddress(_options.FromEmail, _options.FromName);
        var to = string.IsNullOrWhiteSpace(toName)
            ? new MailAddress(toEmail)
            : new MailAddress(toEmail, toName);

        using var message = new MailMessage(from, to)
        {
            Subject = subject,
            Body = BuildHtmlEmail(subject, body, toName),
            IsBodyHtml = true
        };

        await client.SendMailAsync(message);
    }

    private static string BuildHtmlEmail(string title, string message, string? recipientName)
    {
        var titleLower = title.ToLowerInvariant();
        var isSecurityAlert = titleLower.Contains("login")
            || titleLower.Contains("sign-in")
            || titleLower.Contains("password")
            || titleLower.Contains("inactive")
            || titleLower.Contains("security")
            || titleLower.Contains("blocked");

        // Split prose from structured detail rows (lines starting with ||KEY:VALUE)
        var lines = message.Split('\n');
        var proseLines = new List<string>();
        var detailRows = new List<(string Key, string Value)>();

        foreach (var line in lines)
        {
            if (line.StartsWith("||"))
            {
                var inner = line[2..];
                var colon = inner.IndexOf(':');
                if (colon > 0)
                    detailRows.Add((inner[..colon].Trim(), inner[(colon + 1)..].Trim()));
            }
            else
            {
                proseLines.Add(line);
            }
        }

        var prose = string.Join(" ", proseLines.Where(l => !string.IsNullOrWhiteSpace(l)));
        var safeTitle = WebUtility.HtmlEncode(title);
        var safeProse = WebUtility.HtmlEncode(prose);
        var safeName = WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(recipientName) ? "Valued Customer" : recipientName);

        var detailsHtml = string.Empty;
        if (detailRows.Count > 0)
        {
            var rows = string.Join("", detailRows.Select(r =>
                $"<tr><td style='padding:7px 0;color:#888888;font-size:13px;width:40%;'>{WebUtility.HtmlEncode(r.Key)}</td>" +
                $"<td style='padding:7px 0;color:#111111;font-size:13px;font-weight:600;'>{WebUtility.HtmlEncode(r.Value)}</td></tr>"));

            detailsHtml = $@"
                <table role='presentation' width='100%' cellpadding='0' cellspacing='0'
                       style='margin-top:24px;border-top:1px solid #eeeeee;'>
                  {rows}
                </table>";
        }

        var cautionText = isSecurityAlert
            ? $"If you did not initiate this action, change your password immediately and contact us at <a href='mailto:support@loyalpay.com' style='color:#111111;'>support@loyalpay.com</a>."
            : $"For any questions regarding this notification, contact us at <a href='mailto:support@loyalpay.com' style='color:#111111;'>support@loyalpay.com</a>.";

        return $@"
<!doctype html>
<html>
  <head>
    <meta charset='utf-8' />
    <meta name='viewport' content='width=device-width, initial-scale=1' />
    <title>{safeTitle}</title>
  </head>
  <body style='margin:0;padding:0;background:#f7f7f7;font-family:Arial,Helvetica,sans-serif;color:#111111;'>
    <table role='presentation' width='100%' cellpadding='0' cellspacing='0'>
      <tr>
        <td align='center' style='padding:40px 16px;'>
          <table role='presentation' width='560' cellpadding='0' cellspacing='0'
                 style='max-width:560px;width:100%;background:#ffffff;border:1px solid #e8e8e8;'>

            <!-- Top accent bar -->
            <tr><td style='background:#111111;height:3px;font-size:0;line-height:0;'>&nbsp;</td></tr>

            <!-- Content -->
            <tr>
              <td style='padding:36px 40px 32px 40px;'>

                <!-- Wordmark -->
                <p style='margin:0 0 28px 0;font-size:15px;font-weight:700;color:#111111;letter-spacing:0.3px;'>LoyalPay</p>

                <!-- Greeting + title -->
                <p style='margin:0 0 6px 0;font-size:13px;color:#888888;'>Dear {safeName},</p>
                <h1 style='margin:0 0 20px 0;font-size:19px;font-weight:700;color:#111111;line-height:1.3;border-bottom:1px solid #eeeeee;padding-bottom:16px;'>{safeTitle}</h1>

                <!-- Prose -->
                <p style='margin:0;font-size:14px;line-height:1.8;color:#333333;'>{safeProse}</p>

                <!-- Detail rows -->
                {detailsHtml}

                <!-- Caution -->
                <p style='margin:24px 0 0 0;font-size:13px;line-height:1.7;color:#666666;border-top:1px solid #eeeeee;padding-top:20px;'>
                  {cautionText}
                </p>

              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style='background:#f7f7f7;border-top:1px solid #e8e8e8;padding:16px 40px;'>
                <p style='margin:0;font-size:11px;color:#aaaaaa;line-height:1.6;'>
                  This is an automated notification. Do not reply — this mailbox is not monitored.<br/>
                  &copy; {DateTime.UtcNow.Year} LoyalPay Financial Services.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>";
    }
}
