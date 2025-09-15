using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using FYLA2_Backend.Data;
using FYLA2_Backend.Models;
using FYLA2_Backend.DTOs.Branding;
using FYLA2_Backend.DTOs.ChairRental;
using FYLA2_Backend.DTOs.CustomBranding;
using FYLA2_Backend.DTOs;
using System.Security.Claims;
using System.Text.Json;

namespace FYLA2_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BrandingController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<BrandingController> _logger;

        public BrandingController(ApplicationDbContext context, ILogger<BrandingController> logger)
        {
            _context = context;
            _logger = logger;
        }

        private string GetUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
        }

        private bool IsServiceProvider()
        {
            return User.FindFirst("IsServiceProvider")?.Value == "True";
        }

        // GET: api/Branding/profile
        [HttpGet("profile")]
        public async Task<ActionResult<BrandProfileDto>> GetBrandProfile()
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId) || !IsServiceProvider())
                {
                    return Unauthorized("Only service providers can access branding features.");
                }

                var brandProfile = await _context.BrandProfiles
                    .Include(bp => bp.EmailTemplates)
                    .FirstOrDefaultAsync(bp => bp.ServiceProviderId == userId);

                if (brandProfile == null)
                {
                    return NotFound("Brand profile not found. Create one first.");
                }

                return Ok(MapToBrandProfileDto(brandProfile));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting brand profile for user {UserId}", GetUserId());
                return StatusCode(500, "An error occurred while retrieving the brand profile.");
            }
        }

        // POST: api/Branding/profile
        [HttpPost("profile")]
        public async Task<ActionResult<BrandProfileDto>> CreateBrandProfile([FromBody] CreateBrandProfileDto dto)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId) || !IsServiceProvider())
                {
                    return Unauthorized("Only service providers can create branding profiles.");
                }

                // Check if profile already exists
                var existingProfile = await _context.BrandProfiles
                    .FirstOrDefaultAsync(bp => bp.ServiceProviderId == userId);

                if (existingProfile != null)
                {
                    return Conflict("Brand profile already exists. Use PUT to update.");
                }

                var brandProfile = new BrandProfile
                {
                    ServiceProviderId = userId,
                    BusinessName = dto.BusinessName,
                    PrimaryColor = dto.PrimaryColor,
                    SecondaryColor = dto.SecondaryColor,
                    AccentColor = dto.AccentColor,
                    FontFamily = dto.FontFamily,
                    Tagline = dto.Tagline,
                    Description = dto.Description,
                    WebsiteUrl = dto.WebsiteUrl,
                    InstagramHandle = dto.InstagramHandle,
                    FacebookPage = dto.FacebookPage,
                    TwitterHandle = dto.TwitterHandle,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.BrandProfiles.Add(brandProfile);
                await _context.SaveChangesAsync();

                // Create default email templates
                await CreateDefaultEmailTemplates(brandProfile.Id);

                var createdProfile = await _context.BrandProfiles
                    .Include(bp => bp.EmailTemplates)
                    .FirstAsync(bp => bp.Id == brandProfile.Id);

                return CreatedAtAction(nameof(GetBrandProfile), MapToBrandProfileDto(createdProfile));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating brand profile for user {UserId}", GetUserId());
                return StatusCode(500, "An error occurred while creating the brand profile.");
            }
        }

        // PUT: api/Branding/profile
        [HttpPut("profile")]
        public async Task<ActionResult<BrandProfileDto>> UpdateBrandProfile([FromBody] UpdateBrandProfileDto dto)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId) || !IsServiceProvider())
                {
                    return Unauthorized("Only service providers can update branding profiles.");
                }

                var brandProfile = await _context.BrandProfiles
                    .Include(bp => bp.EmailTemplates)
                    .FirstOrDefaultAsync(bp => bp.ServiceProviderId == userId);

                if (brandProfile == null)
                {
                    return NotFound("Brand profile not found.");
                }

                // Update properties
                brandProfile.BusinessName = dto.BusinessName;
                brandProfile.PrimaryColor = dto.PrimaryColor;
                brandProfile.SecondaryColor = dto.SecondaryColor;
                brandProfile.AccentColor = dto.AccentColor;
                brandProfile.FontFamily = dto.FontFamily;
                brandProfile.Tagline = dto.Tagline;
                brandProfile.Description = dto.Description;
                brandProfile.WebsiteUrl = dto.WebsiteUrl;
                brandProfile.InstagramHandle = dto.InstagramHandle;
                brandProfile.FacebookPage = dto.FacebookPage;
                brandProfile.TwitterHandle = dto.TwitterHandle;
                brandProfile.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(MapToBrandProfileDto(brandProfile));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating brand profile for user {UserId}", GetUserId());
                return StatusCode(500, "An error occurred while updating the brand profile.");
            }
        }

        // GET: api/Branding/theme/{serviceProviderId}
        [HttpGet("theme/{serviceProviderId}")]
        [AllowAnonymous]
        public async Task<ActionResult<BrandThemeDto>> GetBrandTheme(string serviceProviderId)
        {
            try
            {
                var brandProfile = await _context.BrandProfiles
                    .FirstOrDefaultAsync(bp => bp.ServiceProviderId == serviceProviderId && bp.IsActive);

                if (brandProfile == null)
                {
                    // Return default theme
                    return Ok(new BrandThemeDto
                    {
                        PrimaryColor = "#1f2937",
                        SecondaryColor = "#3b82f6",
                        AccentColor = "#10b981",
                        FontFamily = "Inter",
                        BusinessName = "Service Provider"
                    });
                }

                return Ok(new BrandThemeDto
                {
                    PrimaryColor = brandProfile.PrimaryColor,
                    SecondaryColor = brandProfile.SecondaryColor,
                    AccentColor = brandProfile.AccentColor,
                    FontFamily = brandProfile.FontFamily,
                    LogoUrl = brandProfile.LogoUrl,
                    BusinessName = brandProfile.BusinessName
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting brand theme for provider {ProviderId}", serviceProviderId);
                return StatusCode(500, "An error occurred while retrieving the brand theme.");
            }
        }

        // POST: api/Branding/upload-logo
        [HttpPost("upload-logo")]
        public async Task<ActionResult<string>> UploadLogo([FromForm] IFormFile logoFile)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId) || !IsServiceProvider())
                {
                    return Unauthorized("Only service providers can upload logos.");
                }

                if (logoFile == null || logoFile.Length == 0)
                {
                    return BadRequest("No file uploaded.");
                }

                // Validate file type
                var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/svg+xml" };
                if (!allowedTypes.Contains(logoFile.ContentType.ToLower()))
                {
                    return BadRequest("Only JPEG, PNG, and SVG files are allowed.");
                }

                // Validate file size (max 5MB)
                if (logoFile.Length > 5 * 1024 * 1024)
                {
                    return BadRequest("File size must be less than 5MB.");
                }

                // Create uploads directory if it doesn't exist
                var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "logos");
                Directory.CreateDirectory(uploadsPath);

                // Generate unique filename
                var fileExtension = Path.GetExtension(logoFile.FileName);
                var fileName = $"{userId}_{DateTime.UtcNow:yyyyMMddHHmmss}{fileExtension}";
                var filePath = Path.Combine(uploadsPath, fileName);

                // Save file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await logoFile.CopyToAsync(stream);
                }

                // Update brand profile with logo URL
                var brandProfile = await _context.BrandProfiles
                    .FirstOrDefaultAsync(bp => bp.ServiceProviderId == userId);

                if (brandProfile != null)
                {
                    // Delete old logo file if exists
                    if (!string.IsNullOrEmpty(brandProfile.LogoUrl))
                    {
                        var oldLogoPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", brandProfile.LogoUrl.TrimStart('/'));
                        if (System.IO.File.Exists(oldLogoPath))
                        {
                            System.IO.File.Delete(oldLogoPath);
                        }
                    }

                    brandProfile.LogoUrl = $"/uploads/logos/{fileName}";
                    brandProfile.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }

                return Ok($"/uploads/logos/{fileName}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading logo for user {UserId}", GetUserId());
                return StatusCode(500, "An error occurred while uploading the logo.");
            }
        }

        // GET: api/Branding/email-templates
        [HttpGet("email-templates")]
        public async Task<ActionResult<List<BrandedEmailTemplateDto>>> GetEmailTemplates()
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId) || !IsServiceProvider())
                {
                    return Unauthorized("Only service providers can access email templates.");
                }

                var brandProfile = await _context.BrandProfiles
                    .Include(bp => bp.EmailTemplates)
                    .FirstOrDefaultAsync(bp => bp.ServiceProviderId == userId);

                if (brandProfile == null)
                {
                    return NotFound("Brand profile not found.");
                }

                var templates = brandProfile.EmailTemplates.Select(t => new BrandedEmailTemplateDto
                {
                    Id = t.Id,
                    TemplateType = t.TemplateType,
                    Subject = t.Subject,
                    HtmlContent = t.HtmlContent,
                    TextContent = t.TextContent,
                    IsActive = t.IsActive,
                    CreatedAt = t.CreatedAt
                }).ToList();

                return Ok(templates);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting email templates for user {UserId}", GetUserId());
                return StatusCode(500, "An error occurred while retrieving email templates.");
            }
        }

        // PUT: api/Branding/email-templates/{id}
        [HttpPut("email-templates/{id}")]
        public async Task<ActionResult> UpdateEmailTemplate(int id, [FromBody] CreateEmailTemplateDto dto)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId) || !IsServiceProvider())
                {
                    return Unauthorized("Only service providers can update email templates.");
                }

                var template = await _context.BrandedEmailTemplates
                    .Include(t => t.BrandProfile)
                    .FirstOrDefaultAsync(t => t.Id == id && t.BrandProfile.ServiceProviderId == userId);

                if (template == null)
                {
                    return NotFound("Email template not found.");
                }

                template.Subject = dto.Subject;
                template.HtmlContent = dto.HtmlContent;
                template.TextContent = dto.TextContent;
                template.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok("Email template updated successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating email template {TemplateId} for user {UserId}", id, GetUserId());
                return StatusCode(500, "An error occurred while updating the email template.");
            }
        }

        // GET: api/Branding/social-media-kit
    [HttpGet("social-media-kit")]
    public async Task<ActionResult<SocialMediaKitDto>> GenerateSocialMediaKit()
    {
        if (!await HasBusinessAccess())
            return Forbid("Business plan required for social media kit");

        var userId = GetCurrentUserId();

        var brandProfile = await _context.BrandProfiles
            .FirstOrDefaultAsync(bp => bp.ServiceProviderId == userId);

        if (brandProfile == null)
            return NotFound("Brand profile not found");

        var kit = new SocialMediaKitDto
        {
            InstagramPosts = GenerateInstagramPosts(brandProfile),
            FacebookCovers = GenerateFacebookCovers(brandProfile),
            TwitterHeaders = GenerateTwitterHeaders(brandProfile),
            LinkedInBanners = GenerateLinkedInBanners(brandProfile),
            LogoVariations = GenerateLogoVariations(brandProfile)
        };

        return Ok(kit);
    }

    // TEMPORARILY COMMENTED OUT FOR COMPILATION FIX
    /*
    [HttpGet("public/{serviceProviderId}")]
    [AllowAnonymous]
    public async Task<ActionResult<PublicBrandProfileDto>> GetPublicBrandProfile(string serviceProviderId)
    {
        var brandProfile = await _context.BrandProfiles
            .FirstOrDefaultAsync(bp => bp.ServiceProviderId == serviceProviderId);

        if (brandProfile == null)
            return NotFound("Brand profile not found");

        var publicProfile = new PublicBrandProfileDto
        {
            Id = brandProfile.Id,
            ServiceProviderId = brandProfile.ServiceProviderId,
            BusinessName = brandProfile.BusinessName,
            LogoUrl = brandProfile.LogoUrl,
            PrimaryColor = brandProfile.PrimaryColor,
            SecondaryColor = brandProfile.SecondaryColor,
            AccentColor = brandProfile.AccentColor,
            FontFamily = brandProfile.FontFamily,
            Tagline = brandProfile.Tagline,
            Description = brandProfile.Description,
            SocialMediaLinks = string.IsNullOrEmpty(brandProfile.SocialMediaLinks) ? 
                new object() : JsonSerializer.Deserialize<object>(brandProfile.SocialMediaLinks)
        };

        return Ok(publicProfile);
    }
    */

    #region Helper Methods

    private async Task CreateDefaultEmailTemplates(int brandProfileId)
    {
            var templates = new List<BrandedEmailTemplate>
            {
                new BrandedEmailTemplate
                {
                    BrandProfileId = brandProfileId,
                    TemplateType = "booking_confirmation",
                    Subject = "Booking Confirmation - {{businessName}}",
                    HtmlContent = GetDefaultHtmlTemplate("booking_confirmation"),
                    TextContent = GetDefaultTextTemplate("booking_confirmation")
                },
                new BrandedEmailTemplate
                {
                    BrandProfileId = brandProfileId,
                    TemplateType = "reminder",
                    Subject = "Appointment Reminder - {{businessName}}",
                    HtmlContent = GetDefaultHtmlTemplate("reminder"),
                    TextContent = GetDefaultTextTemplate("reminder")
                },
                new BrandedEmailTemplate
                {
                    BrandProfileId = brandProfileId,
                    TemplateType = "receipt",
                    Subject = "Payment Receipt - {{businessName}}",
                    HtmlContent = GetDefaultHtmlTemplate("receipt"),
                    TextContent = GetDefaultTextTemplate("receipt")
                }
            };

            _context.BrandedEmailTemplates.AddRange(templates);
            await _context.SaveChangesAsync();
        }

        private string GetDefaultHtmlTemplate(string type)
        {
            return type switch
            {
                "booking_confirmation" => @"
                    <div style='font-family: {{fontFamily}}, sans-serif; color: {{primaryColor}};'>
                        <h1 style='color: {{primaryColor}};'>Booking Confirmed!</h1>
                        <p>Dear {{clientName}},</p>
                        <p>Your appointment has been confirmed:</p>
                        <div style='background: {{secondaryColor}}; padding: 20px; border-radius: 8px; color: white;'>
                            <h3>{{serviceName}}</h3>
                            <p>Date: {{appointmentDate}}</p>
                            <p>Time: {{appointmentTime}}</p>
                            <p>Duration: {{duration}} minutes</p>
                            <p>Total: ${{totalAmount}}</p>
                        </div>
                        <p>Looking forward to seeing you!</p>
                        <p>Best regards,<br>{{businessName}}</p>
                    </div>",
                "reminder" => @"
                    <div style='font-family: {{fontFamily}}, sans-serif; color: {{primaryColor}};'>
                        <h1 style='color: {{accentColor}};'>Appointment Reminder</h1>
                        <p>Dear {{clientName}},</p>
                        <p>This is a friendly reminder about your upcoming appointment:</p>
                        <div style='background: {{secondaryColor}}; padding: 20px; border-radius: 8px; color: white;'>
                            <h3>{{serviceName}}</h3>
                            <p>Tomorrow at {{appointmentTime}}</p>
                        </div>
                        <p>See you soon!</p>
                        <p>{{businessName}}</p>
                    </div>",
                "receipt" => @"
                    <div style='font-family: {{fontFamily}}, sans-serif; color: {{primaryColor}};'>
                        <h1 style='color: {{primaryColor}};'>Payment Receipt</h1>
                        <p>Dear {{clientName}},</p>
                        <p>Thank you for your payment!</p>
                        <div style='background: #f8f9fa; padding: 20px; border-radius: 8px;'>
                            <h3>{{serviceName}}</h3>
                            <p>Amount Paid: ${{totalAmount}}</p>
                            <p>Payment Method: {{paymentMethod}}</p>
                            <p>Transaction ID: {{transactionId}}</p>
                        </div>
                        <p>Thank you for choosing {{businessName}}!</p>
                    </div>",
                _ => "<p>Default template</p>"
            };
        }

        private string GetDefaultTextTemplate(string type)
        {
            return type switch
            {
                "booking_confirmation" => @"
                    Booking Confirmed!
                    
                    Dear {{clientName}},
                    
                    Your appointment has been confirmed:
                    
                    Service: {{serviceName}}
                    Date: {{appointmentDate}}
                    Time: {{appointmentTime}}
                    Duration: {{duration}} minutes
                    Total: ${{totalAmount}}
                    
                    Looking forward to seeing you!
                    
                    Best regards,
                    {{businessName}}",
                "reminder" => @"
                    Appointment Reminder
                    
                    Dear {{clientName}},
                    
                    This is a friendly reminder about your upcoming appointment:
                    
                    Service: {{serviceName}}
                    Time: Tomorrow at {{appointmentTime}}
                    
                    See you soon!
                    {{businessName}}",
                "receipt" => @"
                    Payment Receipt
                    
                    Dear {{clientName}},
                    
                    Thank you for your payment!
                    
                    Service: {{serviceName}}
                    Amount Paid: ${{totalAmount}}
                    Payment Method: {{paymentMethod}}
                    Transaction ID: {{transactionId}}
                    
                    Thank you for choosing {{businessName}}!",
                _ => "Default template"
            };
        }

        private BrandProfileDto MapToBrandProfileDto(BrandProfile brandProfile)
        {
            return new BrandProfileDto
            {
                Id = brandProfile.Id,
                ServiceProviderId = brandProfile.ServiceProviderId,
                BusinessName = brandProfile.BusinessName,
                LogoUrl = brandProfile.LogoUrl,
                PrimaryColor = brandProfile.PrimaryColor,
                SecondaryColor = brandProfile.SecondaryColor,
                AccentColor = brandProfile.AccentColor,
                FontFamily = brandProfile.FontFamily,
                Tagline = brandProfile.Tagline,
                Description = brandProfile.Description,
                WebsiteUrl = brandProfile.WebsiteUrl,
                InstagramHandle = brandProfile.InstagramHandle,
                FacebookPage = brandProfile.FacebookPage,
                TwitterHandle = brandProfile.TwitterHandle,
                IsActive = brandProfile.IsActive,
                CreatedAt = brandProfile.CreatedAt,
                UpdatedAt = brandProfile.UpdatedAt
            };
        }

        #endregion

        #region Helper Methods

        private async Task<bool> HasBusinessAccess()
        {
            var userId = GetCurrentUserId();
            // Check if user has business plan
            var subscription = await _context.Subscriptions
                .FirstOrDefaultAsync(s => s.UserId == userId && s.Status == SubscriptionStatus.Active);
            
            return subscription?.Tier == SubscriptionTier.Business;
        }

        private string GetCurrentUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? throw new UnauthorizedAccessException();
        }

        private List<string> GenerateInstagramPosts(BrandProfile brand)
        {
            return new List<string>
            {
                $"Instagram post design for {brand.BusinessName} with colors {brand.PrimaryColor}, {brand.SecondaryColor}",
                $"Quote post: '{brand.Tagline}' - {brand.BusinessName}",
                $"Service showcase post for {brand.BusinessName}"
            };
        }

        private List<string> GenerateFacebookCovers(BrandProfile brand)
        {
            return new List<string>
            {
                $"Facebook cover design for {brand.BusinessName}",
                $"Promotional cover with {brand.Tagline}"
            };
        }

        private List<string> GenerateTwitterHeaders(BrandProfile brand)
        {
            return new List<string>
            {
                $"Twitter header for {brand.BusinessName}",
                $"Professional header with {brand.PrimaryColor} theme"
            };
        }

        private List<string> GenerateLinkedInBanners(BrandProfile brand)
        {
            return new List<string>
            {
                $"LinkedIn banner for {brand.BusinessName}",
                $"Business banner with tagline: {brand.Tagline}"
            };
        }

        private List<string> GenerateLogoVariations(BrandProfile brand)
        {
            return new List<string>
            {
                $"Primary logo variation for {brand.BusinessName}",
                $"Monochrome logo variation",
                $"Icon-only logo variation"
            };
        }

        #endregion
    }
}
