using LoyalPay.AdminService.Application.Interfaces;
using LoyalPay.AdminService.Application.Services;
using LoyalPay.AdminService.Infrastructure.Persistence.DbContext;
using LoyalPay.Shared.Extensions;
using MassTransit;
using Microsoft.EntityFrameworkCore;

ServiceExtensions.LoadEnv();

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddEnvironmentVariables();

var authConnectionString    = builder.Configuration["AUTH_DB"]    ?? builder.Configuration.GetConnectionString("AuthDb")    ?? string.Empty;
var walletConnectionString  = builder.Configuration["WALLET_DB"]  ?? builder.Configuration.GetConnectionString("WalletDb")  ?? string.Empty;
var rewardsConnectionString = builder.Configuration["REWARDS_DB"] ?? builder.Configuration.GetConnectionString("RewardsDb") ?? string.Empty;

var jwtSecret   = builder.Configuration["JWT_SECRET"]    ?? builder.Configuration["JwtSettings:Secret"]   ?? string.Empty;
var jwtIssuer   = builder.Configuration["JWT_ISSUER"]    ?? builder.Configuration["JwtSettings:Issuer"]   ?? string.Empty;
var jwtAudience = builder.Configuration["JWT_AUDIENCE"]  ?? builder.Configuration["JwtSettings:Audience"] ?? string.Empty;
var rabbitHost  = builder.Configuration["RABBITMQ_HOST"] ?? builder.Configuration["RabbitMq:Host"]        ?? "localhost";
var rabbitUser  = builder.Configuration["RABBITMQ_USER"] ?? builder.Configuration["RabbitMq:Username"]    ?? "guest";
var rabbitPass  = builder.Configuration["RABBITMQ_PASS"] ?? builder.Configuration["RabbitMq:Password"]    ?? "guest";

builder.Services.AddLoyalPayControllers();
builder.Services.AddLoyalPaySwagger("LoyalPay Admin API");

// Auth

builder.Services.AddLoyalPayJwt(jwtSecret, jwtIssuer, jwtAudience);
builder.Services.AddLoyalPayCors();

// DbContext

builder.Services.AddDbContext<AdminAuthDbContext>(o => o.UseSqlServer(authConnectionString));
builder.Services.AddDbContext<AdminWalletDbContext>(o => o.UseSqlServer(walletConnectionString));
builder.Services.AddDbContext<AdminRewardsDbContext>(o => o.UseSqlServer(rewardsConnectionString));

// Services

builder.Services.AddScoped<IAdminService, AdminService>();

// MassTransit

builder.Services.AddMassTransit(x =>
{
    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(rabbitHost, "/", h =>
        {
            h.Username(rabbitUser);
            h.Password(rabbitPass);
        });

        cfg.ConfigureEndpoints(context);
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var rewardsDb = scope.ServiceProvider.GetRequiredService<AdminRewardsDbContext>();
    rewardsDb.Database.Migrate();

    var authDb = scope.ServiceProvider.GetRequiredService<AdminAuthDbContext>();
    SeedData.EnsureAdmin(authDb);
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors(ServiceExtensions.CorsPolicyName);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
