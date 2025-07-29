using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using FYLA2_Backend.Data;
using FYLA2_Backend.Models;
using FYLA2_Backend.Services;
using FYLA2_Backend.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add Entity Framework
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection") ??
    "Data Source=fyla2.db"));

// Add Identity
builder.Services.AddIdentity<User, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Add JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? "YourSuperSecretKeyThatIsAtLeast32CharactersLong!";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"] ?? "FYLA2",
        ValidAudience = jwtSettings["Audience"] ?? "FYLA2",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.Zero
    };
    
    // Configure JWT for SignalR
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/chathub"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

// Add AutoMapper
builder.Services.AddAutoMapper(typeof(Program));

// Add SignalR with configuration
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true;
    options.HandshakeTimeout = TimeSpan.FromSeconds(30);
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(60);
});

// Add HttpClient for push notifications
builder.Services.AddHttpClient();

// Add Data Seeding Service
builder.Services.AddScoped<DataSeedingService>();

// Add Push Notification Service
builder.Services.AddScoped<IPushNotificationService, PushNotificationService>();

// Add Payment Services
builder.Services.AddScoped<IPaymentCalculationService, PaymentCalculationService>();
builder.Services.AddScoped<IEnhancedPaymentService, EnhancedPaymentService>();

// Configure Stripe
Stripe.StripeConfiguration.ApiKey = builder.Configuration["Stripe:SecretKey"];

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowMobile", policy =>
    {
        policy.WithOrigins("http://localhost:19006", "http://localhost:8081", "exp://192.168.1.185:8081", "http://192.168.1.185:8081")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // Required for SignalR
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Configure static files for file uploads
app.UseStaticFiles();

app.UseCors("AllowMobile");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Map SignalR Hub
app.MapHub<ChatHub>("/chathub");

// Test endpoint
app.MapGet("/", () => "FYLA2 Beauty Booking API is running!");

// Seed data in development
if (app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        var seedingService = scope.ServiceProvider.GetRequiredService<DataSeedingService>();
        await seedingService.SeedDataAsync();
    }
}

app.Run();
