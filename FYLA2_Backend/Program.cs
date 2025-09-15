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
});

// Add AutoMapper
builder.Services.AddAutoMapper(typeof(Program));

// Add SignalR
builder.Services.AddSignalR();

// Add HttpClient for push notifications
builder.Services.AddHttpClient();

// Add Data Seeding Service
builder.Services.AddScoped<DataSeedingService>();

// Add Push Notification Service
builder.Services.AddScoped<IPushNotificationService, PushNotificationService>();

// Add Loyalty Service
builder.Services.AddScoped<ILoyaltyService, LoyaltyService>();

// Add File Upload Service
builder.Services.Configure<FileUploadOptions>(options =>
{
    options.UploadPath = Path.Combine(builder.Environment.WebRootPath, "uploads");
    options.BaseUrl = builder.Configuration["BaseUrl"] ?? "https://localhost:7002";
    options.MaxFileSize = 5 * 1024 * 1024; // 5MB
    options.AllowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
});
builder.Services.AddScoped<IFileUploadService, FileUploadService>();

// Add Stripe Setup Service
builder.Services.AddScoped<IStripeSetupService, StripeSetupService>();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowMobile", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
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
