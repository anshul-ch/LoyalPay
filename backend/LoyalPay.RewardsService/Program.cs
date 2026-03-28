using LoyalPay.RewardsService.Consumers;
using LoyalPay.RewardsService.Data;
using LoyalPay.RewardsService.Models;
using LoyalPay.RewardsService.Repositories;
using LoyalPay.RewardsService.Services;
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
builder.Services.AddLoyalPayJwt(jwtSecret, jwtIssuer, jwtAudience);
builder.Services.AddLoyalPayCors();

builder.Services.AddDbContext<RewardsDbContext>(o => o.UseSqlServer(connectionString));
builder.Services.AddScoped<IRewardAccountRepository, RewardAccountRepository>();
builder.Services.AddScoped<ICatalogItemRepository, CatalogItemRepository>();
builder.Services.AddScoped<IRedemptionRepository, RedemptionRepository>();
builder.Services.AddScoped<IRewardTransactionRepository, RewardTransactionRepository>();
builder.Services.AddScoped<LoyalPay.RewardsService.Services.RewardsService>();

builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<UserRegisteredConsumer>();
    x.AddConsumer<TopUpCompletedConsumer>();

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
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<RewardsDbContext>();
    db.Database.Migrate();

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
