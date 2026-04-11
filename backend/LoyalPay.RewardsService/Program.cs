using LoyalPay.RewardsService.Application.Interfaces;
using LoyalPay.RewardsService.Application.Services;
using LoyalPay.RewardsService.Domain.Entities;
using LoyalPay.RewardsService.Domain.Interfaces;
using LoyalPay.RewardsService.Infrastructure.Messaging;
using LoyalPay.RewardsService.Infrastructure.Persistence.DbContext;
using LoyalPay.RewardsService.Infrastructure.Persistence.Repositories;
using LoyalPay.Shared.Extensions;
using MassTransit;
using Microsoft.EntityFrameworkCore;

ServiceExtensions.LoadEnv();

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddEnvironmentVariables();

var connectionString = builder.Configuration["REWARDS_DB"]
    ?? builder.Configuration.GetConnectionString("RewardsDb")
    ?? string.Empty;

var jwtSecret   = builder.Configuration["JWT_SECRET"]    ?? builder.Configuration["JwtSettings:Secret"]   ?? string.Empty;
var jwtIssuer   = builder.Configuration["JWT_ISSUER"]    ?? builder.Configuration["JwtSettings:Issuer"]   ?? string.Empty;
var jwtAudience = builder.Configuration["JWT_AUDIENCE"]  ?? builder.Configuration["JwtSettings:Audience"] ?? string.Empty;
var rabbitHost  = builder.Configuration["RABBITMQ_HOST"] ?? builder.Configuration["RabbitMq:Host"]        ?? "localhost";
var rabbitUser  = builder.Configuration["RABBITMQ_USER"] ?? builder.Configuration["RabbitMq:Username"]    ?? "guest";
var rabbitPass  = builder.Configuration["RABBITMQ_PASS"] ?? builder.Configuration["RabbitMq:Password"]    ?? "guest";

builder.Services.AddLoyalPayControllers();
builder.Services.AddLoyalPaySwagger("LoyalPay Rewards API");

// Auth

builder.Services.AddLoyalPayJwt(jwtSecret, jwtIssuer, jwtAudience);
builder.Services.AddLoyalPayCors();

// DbContext

builder.Services.AddDbContext<RewardsDbContext>(o => o.UseSqlServer(connectionString));

// Services

builder.Services.AddScoped<IRewardAccountRepository, RewardAccountRepository>();
builder.Services.AddScoped<ICatalogItemRepository, CatalogItemRepository>();
builder.Services.AddScoped<IRedemptionRepository, RedemptionRepository>();
builder.Services.AddScoped<IRewardTransactionRepository, RewardTransactionRepository>();
builder.Services.AddScoped<IRewardsService, RewardsService>();

// MassTransit

builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<UserRegisteredConsumer>();
    x.AddConsumer<TopUpCompletedConsumer>();
    x.AddConsumer<TransferCompletedConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(rabbitHost, "/", h =>
        {
            h.Username(rabbitUser);
            h.Password(rabbitPass);
        });

        cfg.ReceiveEndpoint("rewards-user-registered", e =>
        {
            e.ConfigureConsumer<UserRegisteredConsumer>(context);
        });

        cfg.ReceiveEndpoint("rewards-top-up-completed", e =>
        {
            e.ConfigureConsumer<TopUpCompletedConsumer>(context);
        });

        cfg.ReceiveEndpoint("rewards-transfer-completed", e =>
        {
            e.ConfigureConsumer<TransferCompletedConsumer>(context);
        });
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<RewardsDbContext>();
    db.Database.Migrate();

    var now = DateTime.UtcNow;
    var expired = db.CatalogItems.Where(c => c.ExpiresAt != null && c.ExpiresAt <= now).ToList();
    if (expired.Count > 0)
    {
        db.CatalogItems.RemoveRange(expired);
        db.SaveChanges();
    }

    if (!db.CatalogItems.Any())
    {
        db.CatalogItems.AddRange(
            new CatalogItem { Name = "INR 50 Cashback",      Description = "INR 50 added to your wallet",   ItemType = "Cashback", PointsCost = 200,  Stock = -1,  IsActive = true },
            new CatalogItem { Name = "10% Off Coupon",       Description = "10% off your next transaction", ItemType = "Coupon",   PointsCost = 500,  Stock = 100, IsActive = true },
            new CatalogItem { Name = "INR 200 Gift Voucher", Description = "Amazon voucher worth INR 200",  ItemType = "Coupon",   PointsCost = 1500, Stock = 30,  IsActive = true }
        );
        db.SaveChanges();
    }
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors(ServiceExtensions.CorsPolicyName);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
