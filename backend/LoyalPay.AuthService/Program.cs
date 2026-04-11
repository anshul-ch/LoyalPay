using LoyalPay.AuthService.Data;
using LoyalPay.AuthService.Services;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddEnvironmentVariables();

var connectionString = builder.Configuration.GetConnectionString("AuthDb") ?? string.Empty;
var authDbFromEnv = builder.Configuration["AUTH_DB"];
if (!string.IsNullOrWhiteSpace(authDbFromEnv))
{
    connectionString = authDbFromEnv;
}

var jwtSecret = builder.Configuration["JwtSettings:Secret"] ?? string.Empty;
var jwtIssuer = builder.Configuration["JwtSettings:Issuer"] ?? string.Empty;
var jwtAudience = builder.Configuration["JwtSettings:Audience"] ?? string.Empty;
var rabbitHost = builder.Configuration["RabbitMq:Host"] ?? string.Empty;
var rabbitUser = builder.Configuration["RabbitMq:Username"] ?? string.Empty;
var rabbitPass = builder.Configuration["RabbitMq:Password"] ?? string.Empty;

if (string.IsNullOrWhiteSpace(jwtSecret))
{
    jwtSecret = builder.Configuration["JWT_SECRET"] ?? string.Empty;
}

if (string.IsNullOrWhiteSpace(jwtIssuer))
{
    jwtIssuer = builder.Configuration["JWT_ISSUER"] ?? string.Empty;
}

if (string.IsNullOrWhiteSpace(jwtAudience))
{
    jwtAudience = builder.Configuration["JWT_AUDIENCE"] ?? string.Empty;
}

if (string.IsNullOrWhiteSpace(rabbitHost))
{
    rabbitHost = builder.Configuration["RABBITMQ_HOST"] ?? "localhost";
}

if (string.IsNullOrWhiteSpace(rabbitUser))
{
    rabbitUser = builder.Configuration["RABBITMQ_USER"] ?? "guest";
}

if (string.IsNullOrWhiteSpace(rabbitPass))
{
    rabbitPass = builder.Configuration["RABBITMQ_PASS"] ?? "guest";
}

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "LoyalPay Auth API", Version = "v1" });
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
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddDbContext<AuthDbContext>(options =>
{
    options.UseSqlServer(connectionString);
});

builder.Services.AddScoped<LoyalPay.AuthService.Services.AuthService>();
builder.Services.AddScoped<JwtHelper>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
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

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "http://localhost:5000")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("AllowFrontend");
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
