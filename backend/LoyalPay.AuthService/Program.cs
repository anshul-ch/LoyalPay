using LoyalPay.AuthService.Application.Interfaces;
using LoyalPay.AuthService.Application.Services;
using LoyalPay.AuthService.Domain.Interfaces;
using LoyalPay.AuthService.Infrastructure.Persistence.DbContext;
using LoyalPay.AuthService.Infrastructure.Persistence.Repositories;
using LoyalPay.Shared.Extensions;
using MassTransit;
using Microsoft.EntityFrameworkCore;

ServiceExtensions.LoadEnv();

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddEnvironmentVariables();

var connectionString = builder.Configuration["AUTH_DB"]
    ?? builder.Configuration.GetConnectionString("AuthDb")
    ?? string.Empty;

var jwtSecret   = builder.Configuration["JWT_SECRET"]    ?? builder.Configuration["JwtSettings:Secret"]   ?? string.Empty;
var jwtIssuer   = builder.Configuration["JWT_ISSUER"]    ?? builder.Configuration["JwtSettings:Issuer"]   ?? string.Empty;
var jwtAudience = builder.Configuration["JWT_AUDIENCE"]  ?? builder.Configuration["JwtSettings:Audience"] ?? string.Empty;
var rabbitHost  = builder.Configuration["RABBITMQ_HOST"] ?? builder.Configuration["RabbitMq:Host"]        ?? "localhost";
var rabbitUser  = builder.Configuration["RABBITMQ_USER"] ?? builder.Configuration["RabbitMq:Username"]    ?? "guest";
var rabbitPass  = builder.Configuration["RABBITMQ_PASS"] ?? builder.Configuration["RabbitMq:Password"]    ?? "guest";

builder.Services.AddLoyalPayControllers();
builder.Services.AddLoyalPaySwagger("LoyalPay Auth API");

// Auth

builder.Services.AddLoyalPayJwt(jwtSecret, jwtIssuer, jwtAudience);
builder.Services.AddLoyalPayCors();

// DbContext

builder.Services.AddDbContext<AuthDbContext>(options =>
{
    options.UseSqlServer(connectionString);
});

// Services

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
builder.Services.AddScoped<IKycSubmissionRepository, KycSubmissionRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJwtHelper, JwtHelper>();

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

// Auto-migrate on startup so the DB is always up to date.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
    db.Database.Migrate();
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors(ServiceExtensions.CorsPolicyName);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
