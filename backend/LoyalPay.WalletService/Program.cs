using LoyalPay.Shared.Extensions;
using LoyalPay.WalletService.Consumers;
using LoyalPay.WalletService.Data;
using LoyalPay.WalletService.Repositories;
using LoyalPay.WalletService.Services;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddEnvironmentVariables();

var connectionString = builder.Configuration["WALLET_DB"]
    ?? builder.Configuration.GetConnectionString("WalletDb")
    ?? string.Empty;

var jwtSecret   = builder.Configuration["JWT_SECRET"]    ?? builder.Configuration["JwtSettings:Secret"]   ?? string.Empty;
var jwtIssuer   = builder.Configuration["JWT_ISSUER"]    ?? builder.Configuration["JwtSettings:Issuer"]   ?? string.Empty;
var jwtAudience = builder.Configuration["JWT_AUDIENCE"]  ?? builder.Configuration["JwtSettings:Audience"] ?? string.Empty;
var rabbitHost  = builder.Configuration["RABBITMQ_HOST"] ?? builder.Configuration["RabbitMq:Host"]        ?? "localhost";
var rabbitUser  = builder.Configuration["RABBITMQ_USER"] ?? builder.Configuration["RabbitMq:Username"]    ?? "guest";
var rabbitPass  = builder.Configuration["RABBITMQ_PASS"] ?? builder.Configuration["RabbitMq:Password"]    ?? "guest";

builder.Services.AddLoyalPayControllers();
builder.Services.AddLoyalPaySwagger("LoyalPay Wallet API");
builder.Services.AddLoyalPayJwt(jwtSecret, jwtIssuer, jwtAudience);
builder.Services.AddLoyalPayCors();

builder.Services.AddDbContext<WalletDbContext>(o => o.UseSqlServer(connectionString));
builder.Services.AddScoped<IWalletAccountRepository, WalletAccountRepository>();
builder.Services.AddScoped<ILedgerEntryRepository, LedgerEntryRepository>();
builder.Services.AddScoped<ITopUpRequestRepository, TopUpRequestRepository>();
builder.Services.AddScoped<ITransferRequestRepository, TransferRequestRepository>();
builder.Services.AddScoped<LoyalPay.WalletService.Services.WalletService>();
builder.Services.AddScoped<StatementService>();

builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<UserRegisteredConsumer>();

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
    });
});

var app = builder.Build();
QuestPDF.Settings.License = LicenseType.Community;

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors(ServiceExtensions.CorsPolicyName);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
