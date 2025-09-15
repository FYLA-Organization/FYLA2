using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;
using FYLA2_Backend.Data;
using FYLA2_Backend.Models;
using FYLA2_Backend.DTOs.BusinessLocation;
using FYLA2_Backend.DTOs.CustomBranding;
using FYLA2_Backend.DTOs.Marketing;
using FYLA2_Backend.DTOs.Support;

namespace FYLA2_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AdvancedFeaturesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AdvancedFeaturesController> _logger;

        public AdvancedFeaturesController(ApplicationDbContext context, ILogger<AdvancedFeaturesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        private string GetUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new UnauthorizedAccessException();
        }

        private async Task<bool> HasFeatureAccess(string feature)
        {
            var userId = GetUserId();
            var subscription = await _context.Subscriptions
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.CreatedAt)
                .FirstOrDefaultAsync();

            return feature switch
            {
                "CustomBranding" => subscription?.CanUseCustomBranding == true,
                "AutomatedMarketing" => subscription?.CanUseAutomatedMarketing == true,
                "MultiLocation" => subscription?.CanManageMultipleLocations == true,
                "PrioritySupport" => subscription?.HasPrioritySupport == true,
                _ => false
            };
        }

        #region Business Locations

        [HttpGet("test")]
        public ActionResult<string> Test()
        {
            return Ok("AdvancedFeaturesController is working!");
        }

        [HttpGet("locations")]
        public async Task<ActionResult<List<BusinessLocationDto>>> GetBusinessLocations()
        {
            if (!await HasFeatureAccess("MultiLocation"))
            {
                return BadRequest("Multi-location management requires a Business plan subscription.");
            }

            var userId = GetUserId();
            
            var locations = await _context.BusinessLocations
                .Include(l => l.ChairRentals)
                .Where(l => l.UserId == userId)
                .Select(l => new BusinessLocationDto
                {
                    Id = l.Id,
                    UserId = l.UserId,
                    Name = l.Name,
                    Address = l.Address,
                    City = l.City,
                    State = l.State,
                    ZipCode = l.ZipCode,
                    Country = l.Country,
                    Latitude = l.Latitude,
                    Longitude = l.Longitude,
                    Phone = l.Phone,
                    Email = l.Email,
                    Website = l.Website,
                    BusinessHours = string.IsNullOrEmpty(l.BusinessHours) ? new Dictionary<string, object>() : JsonSerializer.Deserialize<Dictionary<string, object>>(l.BusinessHours, (JsonSerializerOptions?)null) ?? new Dictionary<string, object>(),
                    Description = l.Description,
                    ImageUrl = l.ImageUrl,
                    IsActive = l.IsActive,
                    ChairCount = l.ChairRentals.Count,
                    RentedChairCount = l.ChairRentals.Count(c => c.Status == ChairRentalStatus.Rented),
                    CreatedAt = l.CreatedAt
                })
                .ToListAsync();

            return Ok(locations);
        }

        [HttpPost("locations")]
        public async Task<ActionResult<BusinessLocationDto>> CreateBusinessLocation([FromBody] CreateBusinessLocationDto request)
        {
            if (!await HasFeatureAccess("MultiLocation"))
            {
                return BadRequest("Multi-location management requires a Business plan subscription.");
            }

            var userId = GetUserId();

            var location = new BusinessLocation
            {
                UserId = userId,
                Name = request.Name,
                Address = request.Address,
                City = request.City,
                State = request.State,
                ZipCode = request.ZipCode,
                Country = request.Country,
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                Phone = request.Phone,
                Email = request.Email,
                Website = request.Website,
                BusinessHours = JsonSerializer.Serialize(request.BusinessHours),
                Description = request.Description,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.BusinessLocations.Add(location);
            await _context.SaveChangesAsync();

            var locationDto = new BusinessLocationDto
            {
                Id = location.Id,
                UserId = location.UserId,
                Name = location.Name,
                Address = location.Address,
                City = location.City,
                State = location.State,
                ZipCode = location.ZipCode,
                Country = location.Country,
                Latitude = location.Latitude,
                Longitude = location.Longitude,
                Phone = location.Phone,
                Email = location.Email,
                Website = location.Website,
                BusinessHours = request.BusinessHours,
                Description = location.Description,
                IsActive = location.IsActive,
                ChairCount = 0,
                RentedChairCount = 0,
                CreatedAt = location.CreatedAt
            };

            return CreatedAtAction(nameof(GetBusinessLocations), locationDto);
        }

        #endregion

        #region Custom Branding

        [HttpGet("branding")]
        public async Task<ActionResult<CustomBrandingDto>> GetCustomBranding()
        {
            if (!await HasFeatureAccess("CustomBranding"))
            {
                return BadRequest("Custom branding requires a Business plan subscription.");
            }

            var userId = GetUserId();
            
            var branding = await _context.CustomBrandings
                .FirstOrDefaultAsync(b => b.UserId == userId);

            if (branding == null)
            {
                // Return default branding
                return Ok(new CustomBrandingDto
                {
                    UserId = userId,
                    PrimaryColor = "#007AFF",
                    SecondaryColor = "#5856D6",
                    AccentColor = "#FF9500",
                    BusinessName = "",
                    Tagline = "",
                    Description = "",
                    SocialMediaLinks = new Dictionary<string, string>()
                });
            }

            var brandingDto = new CustomBrandingDto
            {
                Id = branding.Id,
                UserId = branding.UserId,
                LogoUrl = branding.LogoUrl,
                BannerUrl = branding.BannerUrl,
                PrimaryColor = branding.PrimaryColor,
                SecondaryColor = branding.SecondaryColor,
                AccentColor = branding.AccentColor,
                BusinessName = branding.BusinessName,
                Tagline = branding.Tagline,
                Description = branding.Description,
                CustomDomain = branding.CustomDomain,
                SocialMediaLinks = string.IsNullOrEmpty(branding.SocialMediaLinks) ? new Dictionary<string, string>() : JsonSerializer.Deserialize<Dictionary<string, string>>(branding.SocialMediaLinks) ?? new Dictionary<string, string>(),
                CreatedAt = branding.CreatedAt
            };

            return Ok(brandingDto);
        }

        [HttpPut("branding")]
        public async Task<ActionResult<CustomBrandingDto>> UpdateCustomBranding([FromBody] UpdateCustomBrandingDto request)
        {
            if (!await HasFeatureAccess("CustomBranding"))
            {
                return BadRequest("Custom branding requires a Business plan subscription.");
            }

            var userId = GetUserId();
            
            var branding = await _context.CustomBrandings
                .FirstOrDefaultAsync(b => b.UserId == userId);

            if (branding == null)
            {
                branding = new CustomBranding
                {
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                };
                _context.CustomBrandings.Add(branding);
            }

            branding.LogoUrl = request.LogoUrl;
            branding.BannerUrl = request.BannerUrl;
            branding.PrimaryColor = request.PrimaryColor;
            branding.SecondaryColor = request.SecondaryColor;
            branding.AccentColor = request.AccentColor;
            branding.BusinessName = request.BusinessName;
            branding.Tagline = request.Tagline;
            branding.Description = request.Description;
            branding.CustomDomain = request.CustomDomain;
            branding.SocialMediaLinks = JsonSerializer.Serialize(request.SocialMediaLinks);
            branding.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var brandingDto = new CustomBrandingDto
            {
                Id = branding.Id,
                UserId = branding.UserId,
                LogoUrl = branding.LogoUrl,
                BannerUrl = branding.BannerUrl,
                PrimaryColor = branding.PrimaryColor,
                SecondaryColor = branding.SecondaryColor,
                AccentColor = branding.AccentColor,
                BusinessName = branding.BusinessName,
                Tagline = branding.Tagline,
                Description = branding.Description,
                CustomDomain = branding.CustomDomain,
                SocialMediaLinks = request.SocialMediaLinks,
                CreatedAt = branding.CreatedAt
            };

            return Ok(brandingDto);
        }

        #endregion

        #region Marketing Campaigns

        [HttpGet("marketing/campaigns")]
        public async Task<ActionResult<List<MarketingCampaignDto>>> GetMarketingCampaigns()
        {
            if (!await HasFeatureAccess("AutomatedMarketing"))
            {
                return BadRequest("Automated marketing requires a Business plan subscription.");
            }

            var userId = GetUserId();
            
            var campaigns = await _context.MarketingCampaigns
                .Where(c => c.UserId == userId)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new MarketingCampaignDto
                {
                    Id = c.Id,
                    UserId = c.UserId,
                    Name = c.Name,
                    Type = c.Type.ToString(),
                    Status = c.Status.ToString(),
                    Subject = c.Subject,
                    Content = c.Content,
                    ScheduledDate = c.ScheduledDate,
                    SentDate = c.SentDate,
                    TargetAudience = string.IsNullOrEmpty(c.TargetAudience) ? new Dictionary<string, object>() : JsonSerializer.Deserialize<Dictionary<string, object>>(c.TargetAudience, (JsonSerializerOptions?)null) ?? new Dictionary<string, object>(),
                    EmailsSent = c.EmailsSent,
                    EmailsOpened = c.EmailsOpened,
                    EmailsClicked = c.EmailsClicked,
                    BookingsGenerated = c.BookingsGenerated,
                    CreatedAt = c.CreatedAt
                })
                .ToListAsync();

            return Ok(campaigns);
        }

        [HttpPost("marketing/campaigns")]
        public async Task<ActionResult<MarketingCampaignDto>> CreateMarketingCampaign([FromBody] CreateMarketingCampaignDto request)
        {
            if (!await HasFeatureAccess("AutomatedMarketing"))
            {
                return BadRequest("Automated marketing requires a Business plan subscription.");
            }

            var userId = GetUserId();

            if (!Enum.TryParse<MarketingCampaignType>(request.Type, true, out var campaignType))
            {
                return BadRequest("Invalid campaign type.");
            }

            var campaign = new MarketingCampaign
            {
                UserId = userId,
                Name = request.Name,
                Type = campaignType,
                Subject = request.Subject,
                Content = request.Content,
                ScheduledDate = request.ScheduledDate,
                TargetAudience = JsonSerializer.Serialize(request.TargetAudience),
                Status = MarketingCampaignStatus.Draft,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.MarketingCampaigns.Add(campaign);
            await _context.SaveChangesAsync();

            var campaignDto = new MarketingCampaignDto
            {
                Id = campaign.Id,
                UserId = campaign.UserId,
                Name = campaign.Name,
                Type = campaign.Type.ToString(),
                Status = campaign.Status.ToString(),
                Subject = campaign.Subject,
                Content = campaign.Content,
                ScheduledDate = campaign.ScheduledDate,
                TargetAudience = request.TargetAudience,
                CreatedAt = campaign.CreatedAt
            };

            return CreatedAtAction(nameof(GetMarketingCampaigns), campaignDto);
        }

        [HttpGet("marketing/analytics")]
        public async Task<ActionResult<MarketingAnalyticsDto>> GetMarketingAnalytics()
        {
            if (!await HasFeatureAccess("AutomatedMarketing"))
            {
                return BadRequest("Automated marketing requires a Business plan subscription.");
            }

            var userId = GetUserId();
            
            var campaigns = await _context.MarketingCampaigns
                .Where(c => c.UserId == userId)
                .ToListAsync();

            var totalCampaigns = campaigns.Count;
            var activeCampaigns = campaigns.Count(c => c.Status == MarketingCampaignStatus.Scheduled || c.Status == MarketingCampaignStatus.Sending);
            var totalEmailsSent = campaigns.Sum(c => c.EmailsSent);
            var totalEmailsOpened = campaigns.Sum(c => c.EmailsOpened);
            var totalEmailsClicked = campaigns.Sum(c => c.EmailsClicked);
            var totalBookingsGenerated = campaigns.Sum(c => c.BookingsGenerated);

            var averageOpenRate = totalEmailsSent > 0 ? (double)totalEmailsOpened / totalEmailsSent * 100 : 0;
            var averageClickRate = totalEmailsSent > 0 ? (double)totalEmailsClicked / totalEmailsSent * 100 : 0;
            var averageConversionRate = totalEmailsSent > 0 ? (double)totalBookingsGenerated / totalEmailsSent * 100 : 0;

            // Calculate estimated revenue (assuming average booking value)
            var estimatedBookingValue = 50m; // This should come from actual booking data
            var revenueFromCampaigns = totalBookingsGenerated * estimatedBookingValue;

            var recentCampaigns = campaigns
                .OrderByDescending(c => c.CreatedAt)
                .Take(5)
                .Select(c => new MarketingCampaignDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Type = c.Type.ToString(),
                    Status = c.Status.ToString(),
                    EmailsSent = c.EmailsSent,
                    EmailsOpened = c.EmailsOpened,
                    EmailsClicked = c.EmailsClicked,
                    BookingsGenerated = c.BookingsGenerated,
                    CreatedAt = c.CreatedAt
                })
                .ToList();

            var analytics = new MarketingAnalyticsDto
            {
                TotalCampaigns = totalCampaigns,
                ActiveCampaigns = activeCampaigns,
                TotalEmailsSent = totalEmailsSent,
                TotalEmailsOpened = totalEmailsOpened,
                TotalEmailsClicked = totalEmailsClicked,
                TotalBookingsGenerated = totalBookingsGenerated,
                AverageOpenRate = averageOpenRate,
                AverageClickRate = averageClickRate,
                AverageConversionRate = averageConversionRate,
                RevenueFromCampaigns = revenueFromCampaigns,
                RecentCampaigns = recentCampaigns
            };

            return Ok(analytics);
        }

        #endregion

        #region Support Tickets

        [HttpGet("support/tickets")]
        public async Task<ActionResult<List<SupportTicketDto>>> GetSupportTickets()
        {
            var userId = GetUserId();
            
            var tickets = await _context.SupportTickets
                .Include(t => t.User)
                .Include(t => t.Messages)
                    .ThenInclude(m => m.Sender)
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new SupportTicketDto
                {
                    Id = t.Id,
                    UserId = t.UserId,
                    UserName = $"{t.User.FirstName} {t.User.LastName}",
                    UserEmail = t.User.Email,
                    Subject = t.Subject,
                    Description = t.Description,
                    Priority = t.Priority.ToString(),
                    Status = t.Status.ToString(),
                    Category = t.Category.ToString(),
                    AssignedToAgent = t.AssignedToAgent,
                    FirstResponseDate = t.FirstResponseDate,
                    ResolvedDate = t.ResolvedDate,
                    CreatedAt = t.CreatedAt,
                    Messages = t.Messages.Select(m => new SupportTicketMessageDto
                    {
                        Id = m.Id,
                        SupportTicketId = m.SupportTicketId,
                        SenderId = m.SenderId,
                        SenderName = $"{m.Sender.FirstName} {m.Sender.LastName}",
                        Content = m.Content,
                        IsFromAgent = m.IsFromAgent,
                        AttachmentUrl = m.AttachmentUrl,
                        CreatedAt = m.CreatedAt
                    }).ToList()
                })
                .ToListAsync();

            return Ok(tickets);
        }

        [HttpPost("support/tickets")]
        public async Task<ActionResult<SupportTicketDto>> CreateSupportTicket([FromBody] CreateSupportTicketDto request)
        {
            var userId = GetUserId();

            if (!Enum.TryParse<SupportTicketPriority>(request.Priority, true, out var priority))
            {
                priority = SupportTicketPriority.Normal;
            }

            if (!Enum.TryParse<SupportTicketCategory>(request.Category, true, out var category))
            {
                return BadRequest("Invalid support category.");
            }

            // Check if user has priority support
            var hasPrioritySupport = await HasFeatureAccess("PrioritySupport");
            if (hasPrioritySupport && priority == SupportTicketPriority.Normal)
            {
                priority = SupportTicketPriority.High; // Upgrade priority for Business plan users
            }

            var ticket = new SupportTicket
            {
                UserId = userId,
                Subject = request.Subject,
                Description = request.Description,
                Priority = priority,
                Category = category,
                Status = SupportTicketStatus.Open,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.SupportTickets.Add(ticket);
            await _context.SaveChangesAsync();

            // Load user data for response
            var user = await _context.Users.FindAsync(userId);

            var ticketDto = new SupportTicketDto
            {
                Id = ticket.Id,
                UserId = ticket.UserId,
                UserName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown",
                UserEmail = user?.Email ?? "Unknown",
                Subject = ticket.Subject,
                Description = ticket.Description,
                Priority = ticket.Priority.ToString(),
                Status = ticket.Status.ToString(),
                Category = ticket.Category.ToString(),
                CreatedAt = ticket.CreatedAt,
                Messages = new List<SupportTicketMessageDto>()
            };

            return CreatedAtAction(nameof(GetSupportTickets), ticketDto);
        }

        [HttpPost("support/tickets/{ticketId}/messages")]
        public async Task<ActionResult> AddSupportTicketMessage(int ticketId, [FromBody] CreateSupportTicketMessageDto request)
        {
            var userId = GetUserId();

            var ticket = await _context.SupportTickets
                .FirstOrDefaultAsync(t => t.Id == ticketId && t.UserId == userId);

            if (ticket == null)
            {
                return NotFound("Support ticket not found.");
            }

            var message = new SupportTicketMessage
            {
                SupportTicketId = ticketId,
                SenderId = userId,
                Content = request.Content,
                AttachmentUrl = request.AttachmentUrl,
                IsFromAgent = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.SupportTicketMessages.Add(message);

            // Update ticket status if it was resolved
            if (ticket.Status == SupportTicketStatus.Resolved || ticket.Status == SupportTicketStatus.Closed)
            {
                ticket.Status = SupportTicketStatus.Open;
                ticket.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Message added to support ticket successfully." });
        }

        #endregion
    }
}
