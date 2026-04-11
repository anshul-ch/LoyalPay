using LoyalPay.AdminService.Data;
using LoyalPay.AdminService.Services;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddEnvironmentVariables();

var authConnectionString = builder.Configuration.GetConnectionString("AuthDb") ?? string.Empty;
var walletConnectionString = builder.Configuration.GetConnectionString("WalletDb") ?? string.Empty;
var rewardsConnectionString = builder.Configuration.GetConnectionString("RewardsDb") ?? string.Empty;

var authDbFromEnv = builder.Configuration["AUTH_DB"];
var walletDbFromEnv = builder.Configuration["WALLET_DB"];
var rewardsDbFromEnv = builder.Configuration["REWARDS_DB"];

if (!string.IsNullOrWhiteSpace(authDbFromEnv)) authConnectionString = authDbFromEnv;
if (!string.IsNullOrWhiteSpace(walletDbFromEnv)) walletConnectionString = walletDbFromEnv;
if (!string.IsNullOrWhiteSpace(rewardsDbFromEnv)) rewardsConnectionString = rewardsDbFromEnv;

var jwtSecret = builder.Configuration["JwtSettings:Secret"] ?? builder.Configuration["JWT_SECRET"] ?? string.Empty;
var jwtIssuer = builder.Configuration["JwtSettings:Issuer"] ?? builder.Configuration["JWT_ISSUER"] ?? string.Empty;
var jwtAudience = builder.Configuration["JwtSettings:Audience"] ?? builder.Configuration["JWT_AUDIENCE"] ?? string.Empty;
var rabbitHost = builder.Configuration["RabbitMq:Host"] ?? builder.Configuration["RABBITMQ_HOST"] ?? "localhost";
var rabbitUser = builder.Configuration["RabbitMq:Username"] ?? builder.Configuration["RABBITMQ_USER"] ?? "guest";
var rabbitPass = builder.Configuration["RabbitMq:Password"] ?? builder.Configuration["RABBITMQ_PASS"] ?? "guest";

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "LoyalPay Admin API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {token}"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddDbContext<AdminAuthDbContext>(o => o.UseSqlServer(authConnectionString));
builder.Services.AddDbContext<AdminWalletDbContext>(o => o.UseSqlServer(walletConnectionString));
builder.Services.AddDbContext<AdminRewardsDbContext>(o => o.UseSqlServer(rewardsConnectionString));
builder.Services.AddScoped<LoyalPay.AdminService.Services.AdminService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

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

builder.Services.AddCors(o => o.AddPolicy("AllowFrontend", p =>
    p.WithOrigins("http://localhost:4200", "http://localhost:5000")
        .AllowAnyHeader()
        .AllowAnyMethod()));

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
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
