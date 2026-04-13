using LoyalPay.NotificationService.Application.Interfaces;
using LoyalPay.NotificationService.Application.Services;
using LoyalPay.NotificationService.Domain.Interfaces;
using LoyalPay.NotificationService.Application.DTOs;
using LoyalPay.NotificationService.Infrastructure.Email;
using LoyalPay.NotificationService.Infrastructure.Messaging;
using LoyalPay.NotificationService.Infrastructure.Persistence.DbContext;
using LoyalPay.NotificationService.Infrastructure.Persistence.Repositories;
using LoyalPay.Shared.Extensions;
using MassTransit;
using Microsoft.EntityFrameworkCore;

ServiceExtensions.LoadEnv();

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddEnvironmentVariables();

var connectionString = builder.Configuration["NOTIFICATION_DB"]
    ?? builder.Configuration.GetConnectionString("NotificationDb")
    ?? string.Empty;

var jwtSecret = builder.Configuration["JWT_SECRET"] ?? builder.Configuration["JwtSettings:Secret"] ?? string.Empty;
var jwtIssuer = builder.Configuration["JWT_ISSUER"] ?? builder.Configuration["JwtSettings:Issuer"] ?? string.Empty;
var jwtAudience = builder.Configuration["JWT_AUDIENCE"] ?? builder.Configuration["JwtSettings:Audience"] ?? string.Empty;
var rabbitHost = builder.Configuration["RABBITMQ_HOST"] ?? builder.Configuration["RabbitMq:Host"] ?? "localhost";
var rabbitUser = builder.Configuration["RABBITMQ_USER"] ?? builder.Configuration["RabbitMq:Username"] ?? "guest";
var rabbitPass = builder.Configuration["RABBITMQ_PASS"] ?? builder.Configuration["RabbitMq:Password"] ?? "guest";

builder.Services.AddLoyalPayControllers();
builder.Services.AddLoyalPaySwagger("LoyalPay Notification API");

builder.Services.AddLoyalPayJwt(jwtSecret, jwtIssuer, jwtAudience);
builder.Services.AddLoyalPayCors();

builder.Services.AddDbContext<NotificationDbContext>(o => o.UseSqlServer(connectionString));

builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<INotificationUserProfileRepository, NotificationUserProfileRepository>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();

builder.Services.Configure<SmtpOptions>(options =>
{
    options.Host = builder.Configuration["SMTP_HOST"] ?? "smtp.gmail.com";
    options.Port = int.TryParse(builder.Configuration["SMTP_PORT"], out var smtpPort) ? smtpPort : 587;
    options.Username = builder.Configuration["SMTP_USERNAME"] ?? string.Empty;
    options.Password = builder.Configuration["SMTP_PASSWORD"] ?? string.Empty;
    options.FromEmail = builder.Configuration["SMTP_FROM_EMAIL"] ?? "noreply@loyalpay.com";
    options.FromName = builder.Configuration["SMTP_FROM_NAME"] ?? "LoyalPay";
    options.EnableSsl = !string.Equals(builder.Configuration["SMTP_ENABLE_SSL"], "false", StringComparison.OrdinalIgnoreCase);
});

builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<UserRegisteredConsumer>();
    x.AddConsumer<UserLoggedInConsumer>();
    x.AddConsumer<ForgotPasswordIssuedConsumer>();
    x.AddConsumer<TopUpCompletedConsumer>();
    x.AddConsumer<TransferCompletedConsumer>();
    x.AddConsumer<UserNotificationRequestedConsumer>();
    x.AddConsumer<UserStatusChangedConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(rabbitHost, "/", h =>
        {
            h.Username(rabbitUser);
            h.Password(rabbitPass);
        });

        cfg.ReceiveEndpoint("notification-user-registered", e =>
        {
            e.ConfigureConsumer<UserRegisteredConsumer>(context);
        });

        cfg.ReceiveEndpoint("notification-user-logged-in", e =>
        {
            e.ConfigureConsumer<UserLoggedInConsumer>(context);
        });

        cfg.ReceiveEndpoint("notification-forgot-password-issued", e =>
        {
            e.ConfigureConsumer<ForgotPasswordIssuedConsumer>(context);
        });

        cfg.ReceiveEndpoint("notification-top-up-completed", e =>
        {
            e.ConfigureConsumer<TopUpCompletedConsumer>(context);
        });

        cfg.ReceiveEndpoint("notification-transfer-completed", e =>
        {
            e.ConfigureConsumer<TransferCompletedConsumer>(context);
        });

        cfg.ReceiveEndpoint("notification-user-notification-requested", e =>
        {
            e.ConfigureConsumer<UserNotificationRequestedConsumer>(context);
        });

        cfg.ReceiveEndpoint("notification-user-status-changed", e =>
        {
            e.ConfigureConsumer<UserStatusChangedConsumer>(context);
        });
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();
    db.Database.EnsureCreated();
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors(ServiceExtensions.CorsPolicyName);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
