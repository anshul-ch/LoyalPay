using LoyalPay.Shared.Extensions;
using LoyalPay.WalletService.Application.Interfaces;
using LoyalPay.WalletService.Application.Services;
using LoyalPay.WalletService.Domain.Interfaces;
using LoyalPay.WalletService.Infrastructure.Messaging;
using LoyalPay.WalletService.Infrastructure.Persistence.DbContext;
using LoyalPay.WalletService.Infrastructure.Persistence.Repositories;
using MassTransit;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Infrastructure;
using System.Net;
using System.Text.Json;

ServiceExtensions.LoadEnv();

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddEnvironmentVariables();

var connectionString = builder.Configuration["WALLET_DB"]
    ?? builder.Configuration.GetConnectionString("WalletDb")
    ?? string.Empty;
var authConnectionString = builder.Configuration["AUTH_DB"]
    ?? builder.Configuration.GetConnectionString("AuthDb")
    ?? string.Empty;

var jwtSecret   = builder.Configuration["JWT_SECRET"]    ?? builder.Configuration["JwtSettings:Secret"]   ?? string.Empty;
var jwtIssuer   = builder.Configuration["JWT_ISSUER"]    ?? builder.Configuration["JwtSettings:Issuer"]   ?? string.Empty;
var jwtAudience = builder.Configuration["JWT_AUDIENCE"]  ?? builder.Configuration["JwtSettings:Audience"] ?? string.Empty;
var rabbitHost  = builder.Configuration["RABBITMQ_HOST"] ?? builder.Configuration["RabbitMq:Host"]        ?? "localhost";
var rabbitUser  = builder.Configuration["RABBITMQ_USER"] ?? builder.Configuration["RabbitMq:Username"]    ?? "guest";
var rabbitPass  = builder.Configuration["RABBITMQ_PASS"] ?? builder.Configuration["RabbitMq:Password"]    ?? "guest";

builder.Services.AddLoyalPayControllers();
builder.Services.AddLoyalPaySwagger("LoyalPay Wallet API");

// Auth

builder.Services.AddLoyalPayJwt(jwtSecret, jwtIssuer, jwtAudience);
builder.Services.AddLoyalPayCors();

// DbContext

builder.Services.AddDbContext<WalletDbContext>(o => o.UseSqlServer(connectionString));
builder.Services.AddDbContext<AuthReadDbContext>(o => o.UseSqlServer(authConnectionString));

// Services

builder.Services.AddScoped<IWalletAccountRepository, WalletAccountRepository>();
builder.Services.AddScoped<ILedgerEntryRepository, LedgerEntryRepository>();
builder.Services.AddScoped<ITopUpRequestRepository, TopUpRequestRepository>();
builder.Services.AddScoped<ITransferRequestRepository, TransferRequestRepository>();
builder.Services.AddScoped<IUserVerificationRepository, UserVerificationRepository>();
builder.Services.AddScoped<IWalletService, WalletService>();
builder.Services.AddScoped<IStatementService, StatementService>();

// MassTransit

builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<UserRegisteredConsumer>();
    x.AddConsumer<CashbackRedeemedConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(rabbitHost, "/", h =>
        {
            h.Username(rabbitUser);
            h.Password(rabbitPass);
        });

        cfg.ReceiveEndpoint("wallet-user-registered", e =>
        {
            e.ConfigureConsumer<UserRegisteredConsumer>(context);
        });

        cfg.ReceiveEndpoint("wallet-cashback-redeemed", e =>
        {
            e.ConfigureConsumer<CashbackRedeemedConsumer>(context);
        });
    });
});

var app = builder.Build();
QuestPDF.Settings.License = LicenseType.Community;

// Global exception handler — returns JSON instead of HTML for all unhandled exceptions
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
        context.Response.ContentType = "application/json";

        var error = context.Features.Get<IExceptionHandlerFeature>();
        var message = app.Environment.IsDevelopment()
            ? error?.Error?.Message ?? "An unexpected error occurred."
            : "An unexpected error occurred. Please try again.";

        var response = JsonSerializer.Serialize(new { success = false, message });
        await context.Response.WriteAsync(response);
    });
});

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<WalletDbContext>();
    db.Database.Migrate();
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors(ServiceExtensions.CorsPolicyName);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
