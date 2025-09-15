using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYLA2_Backend.Data;
using FYLA2_Backend.Models;
using FYLA2_Backend.DTOs;
using FYLA2_Backend.Services;
using System.Security.Claims;
using System.Text.Json;

namespace FYLA2_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProvidersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IFileUploadService _fileUploadService;
        private readonly ILogger<ProvidersController> _logger;

        public ProvidersController(
            ApplicationDbContext context,
            IFileUploadService fileUploadService,
            ILogger<ProvidersController> logger)
        {
            _context = context;
            _fileUploadService = fileUploadService;
            _logger = logger;
        }

        private string GetCurrentUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
        }

        // GET: api/providers/user/{userId}
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<ProviderProfileDto>> GetProviderByUserId(string userId)
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId != userId && !User.IsInRole("Admin"))
            {
                return Forbid();
            }

            var provider = await _context.ServiceProviders
                .Include(sp => sp.User)
                .FirstOrDefaultAsync(sp => sp.UserId == userId);

            if (provider == null)
            {
                return NotFound("Provider profile not found");
            }

            var dto = await MapToProviderProfileDto(provider);
            return Ok(dto);
        }

        // POST: api/providers
        [HttpPost]
        public async Task<ActionResult<ProviderProfileDto>> CreateProvider(CreateProviderProfileDto dto)
        {
            var currentUserId = GetCurrentUserId();

            // Check if provider already exists
            var existingProvider = await _context.ServiceProviders
                .FirstOrDefaultAsync(sp => sp.UserId == currentUserId);

            if (existingProvider != null)
            {
                return BadRequest("Provider profile already exists");
            }

            var provider = new Models.ServiceProvider
            {
                UserId = currentUserId,
                BusinessName = dto.BusinessName,
                BusinessDescription = dto.BusinessDescription,
                BusinessAddress = dto.BusinessAddress,
                BusinessPhone = dto.BusinessPhone,
                BusinessEmail = dto.BusinessEmail,
                BusinessWebsite = dto.BusinessWebsite,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.ServiceProviders.Add(provider);
            await _context.SaveChangesAsync();

            // Add specialties if provided
            if (dto.Specialties?.Any() == true)
            {
                foreach (var specialty in dto.Specialties)
                {
                    var providerSpecialty = new ProviderSpecialty
                    {
                        ProviderId = currentUserId,
                        Name = specialty,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.ProviderSpecialties.Add(providerSpecialty);
                }
                await _context.SaveChangesAsync();
            }

            var responseDto = await MapToProviderProfileDto(provider);
            return CreatedAtAction(nameof(GetProviderByUserId), new { userId = currentUserId }, responseDto);
        }

        // PUT: api/providers/profile
        [HttpPut("profile")]
        public async Task<ActionResult<ProviderProfileDto>> UpdateProviderProfile(UpdateProviderProfileDto dto)
        {
            var currentUserId = GetCurrentUserId();

            var provider = await _context.ServiceProviders
                .FirstOrDefaultAsync(sp => sp.UserId == currentUserId);

            if (provider == null)
            {
                return NotFound("Provider profile not found");
            }

            // Update basic info
            if (!string.IsNullOrEmpty(dto.BusinessName))
                provider.BusinessName = dto.BusinessName;
            if (dto.BusinessDescription != null)
                provider.BusinessDescription = dto.BusinessDescription;
            if (dto.BusinessAddress != null)
                provider.BusinessAddress = dto.BusinessAddress;
            if (dto.BusinessPhone != null)
                provider.BusinessPhone = dto.BusinessPhone;
            if (dto.BusinessEmail != null)
                provider.BusinessEmail = dto.BusinessEmail;
            if (dto.BusinessWebsite != null)
                provider.BusinessWebsite = dto.BusinessWebsite;

            provider.UpdatedAt = DateTime.UtcNow;

            // Update specialties if provided
            if (dto.Specialties != null)
            {
                // Remove existing specialties
                var existingSpecialties = await _context.ProviderSpecialties
                    .Where(ps => ps.ProviderId == currentUserId)
                    .ToListAsync();
                _context.ProviderSpecialties.RemoveRange(existingSpecialties);

                // Add new specialties
                foreach (var specialty in dto.Specialties)
                {
                    var providerSpecialty = new ProviderSpecialty
                    {
                        ProviderId = currentUserId,
                        Name = specialty,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.ProviderSpecialties.Add(providerSpecialty);
                }
            }

            await _context.SaveChangesAsync();

            var responseDto = await MapToProviderProfileDto(provider);
            return Ok(responseDto);
        }

        // POST: api/providers/portfolio/upload
        [HttpPost("portfolio/upload")]
        public async Task<ActionResult<FileUploadResponseDto>> UploadPortfolioImage([FromForm] CreatePortfolioImageDto dto)
        {
            var currentUserId = GetCurrentUserId();

            if (!_fileUploadService.IsValidImageFile(dto.Image))
            {
                return BadRequest("Invalid image file");
            }

            try
            {
                var imageUrl = await _fileUploadService.UploadPortfolioImageAsync(dto.Image, currentUserId);

                var portfolioImage = new ProviderPortfolio
                {
                    ProviderId = currentUserId,
                    ImageUrl = imageUrl,
                    Caption = dto.Caption,
                    Category = dto.Category,
                    DisplayOrder = dto.DisplayOrder,
                    CreatedAt = DateTime.UtcNow
                };

                _context.ProviderPortfolios.Add(portfolioImage);
                await _context.SaveChangesAsync();

                return Ok(new FileUploadResponseDto
                {
                    Id = Guid.NewGuid().ToString(),
                    FileName = dto.Image.FileName,
                    FileUrl = imageUrl,
                    FileSize = dto.Image.Length,
                    Category = "portfolio",
                    UploadedAt = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading portfolio image for provider {ProviderId}", currentUserId);
                return StatusCode(500, "Error uploading image");
            }
        }

        // DELETE: api/providers/portfolio/image
        [HttpDelete("portfolio/image")]
        public async Task<ActionResult> DeletePortfolioImage([FromBody] DeleteImageRequest request)
        {
            var currentUserId = GetCurrentUserId();

            var portfolioImage = await _context.ProviderPortfolios
                .FirstOrDefaultAsync(pp => pp.ProviderId == currentUserId && pp.ImageUrl == request.ImageUrl);

            if (portfolioImage == null)
            {
                return NotFound("Portfolio image not found");
            }

            try
            {
                await _fileUploadService.DeleteImageAsync(request.ImageUrl);
                _context.ProviderPortfolios.Remove(portfolioImage);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Image deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting portfolio image {ImageUrl} for provider {ProviderId}", request.ImageUrl, currentUserId);
                return StatusCode(500, "Error deleting image");
            }
        }

        // PUT: api/providers/business-hours
        [HttpPut("business-hours")]
        public async Task<ActionResult<List<BusinessHoursDto>>> UpdateBusinessHours(UpdateBusinessHoursDto dto)
        {
            var currentUserId = GetCurrentUserId();

            // Remove existing business hours
            var existingHours = await _context.ProviderBusinessHours
                .Where(pbh => pbh.ProviderId == currentUserId)
                .ToListAsync();
            _context.ProviderBusinessHours.RemoveRange(existingHours);

            // Add new business hours
            var newBusinessHours = new List<ProviderBusinessHours>();
            foreach (var hours in dto.BusinessHours)
            {
                var businessHours = new ProviderBusinessHours
                {
                    ProviderId = currentUserId,
                    DayOfWeek = (DayOfWeekEnum)hours.DayOfWeek,
                    IsOpen = hours.IsOpen,
                    OpenTime = hours.IsOpen && !string.IsNullOrEmpty(hours.OpenTime) ? TimeSpan.Parse(hours.OpenTime) : null,
                    CloseTime = hours.IsOpen && !string.IsNullOrEmpty(hours.CloseTime) ? TimeSpan.Parse(hours.CloseTime) : null,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                newBusinessHours.Add(businessHours);
                _context.ProviderBusinessHours.Add(businessHours);
            }

            await _context.SaveChangesAsync();

            var response = newBusinessHours.Select(bh => new BusinessHoursDto
            {
                Id = bh.Id,
                DayOfWeek = (int)bh.DayOfWeek,
                IsOpen = bh.IsOpen,
                OpenTime = bh.OpenTime?.ToString(@"hh\:mm"),
                CloseTime = bh.CloseTime?.ToString(@"hh\:mm")
            }).ToList();

            return Ok(response);
        }

        // GET: api/providers/{providerId}/availability
        [HttpGet("{providerId}/availability")]
        public async Task<ActionResult<ProviderAvailabilityDto>> GetProviderAvailability(string providerId)
        {
            var weeklySchedule = await _context.ProviderSchedules
                .Where(ps => ps.ProviderId == providerId && ps.SpecificDate == null)
                .OrderBy(ps => ps.DayOfWeek)
                .ToListAsync();

            var specialDates = await _context.ProviderBlockedTimes
                .Where(pbt => pbt.ProviderId == providerId)
                .ToListAsync();

            var dto = new ProviderAvailabilityDto
            {
                WeeklySchedule = weeklySchedule.Select(ws => new DayAvailabilityDto
                {
                    DayOfWeek = (int)ws.DayOfWeek,
                    IsAvailable = ws.IsAvailable,
                    StartTime = ws.StartTime?.ToString(@"hh\:mm"),
                    EndTime = ws.EndTime?.ToString(@"hh\:mm"),
                    Breaks = ws.Breaks.Select(b => new BreakDto
                    {
                        StartTime = b.StartTime.ToString(@"hh\:mm"),
                        EndTime = b.EndTime.ToString(@"hh\:mm"),
                        Title = b.Title,
                        Type = b.Type.ToString()
                    }).ToList()
                }).ToList(),
                SpecialDates = specialDates.Select(sd => new SpecialDateDto
                {
                    Date = sd.Date,
                    IsAvailable = false,
                    Reason = sd.Reason
                }).ToList()
            };

            return Ok(dto);
        }

        // PUT: api/providers/availability
        [HttpPut("availability")]
        public async Task<ActionResult<ProviderAvailabilityDto>> UpdateProviderAvailability(UpdateAvailabilityDto dto)
        {
            var currentUserId = GetCurrentUserId();

            // Remove existing weekly schedule
            var existingSchedule = await _context.ProviderSchedules
                .Where(ps => ps.ProviderId == currentUserId && ps.SpecificDate == null)
                .ToListAsync();
            _context.ProviderSchedules.RemoveRange(existingSchedule);

            // Add new weekly schedule
            foreach (var dayAvailability in dto.WeeklySchedule)
            {
                var schedule = new ProviderSchedule
                {
                    ProviderId = currentUserId,
                    DayOfWeek = (DayOfWeekEnum)dayAvailability.DayOfWeek,
                    IsAvailable = dayAvailability.IsAvailable,
                    StartTime = dayAvailability.IsAvailable && !string.IsNullOrEmpty(dayAvailability.StartTime) 
                        ? TimeSpan.Parse(dayAvailability.StartTime) : null,
                    EndTime = dayAvailability.IsAvailable && !string.IsNullOrEmpty(dayAvailability.EndTime) 
                        ? TimeSpan.Parse(dayAvailability.EndTime) : null,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.ProviderSchedules.Add(schedule);
            }

            await _context.SaveChangesAsync();

            // Return updated availability
            return await GetProviderAvailability(currentUserId);
        }

        // GET: api/providers/analytics
        [HttpGet("analytics")]
        public async Task<ActionResult<ProviderAnalyticsDto>> GetProviderAnalytics([FromQuery] string period = "month")
        {
            var currentUserId = GetCurrentUserId();
            var startDate = period switch
            {
                "week" => DateTime.UtcNow.AddDays(-7),
                "year" => DateTime.UtcNow.AddYears(-1),
                _ => DateTime.UtcNow.AddMonths(-1)
            };

            var bookings = await _context.Bookings
                .Include(b => b.Service)
                .Where(b => b.ProviderId == currentUserId && b.CreatedAt >= startDate)
                .ToListAsync();

            var totalBookings = bookings.Count;
            var totalRevenue = bookings.Sum(b => b.TotalPrice);

            var reviews = await _context.Reviews
                .Where(r => r.RevieweeId == currentUserId)
                .ToListAsync();

            var averageRating = reviews.Any() ? reviews.Average(r => r.Rating) : 0.0;
            var totalReviews = reviews.Count;

            var activeServices = await _context.Services
                .CountAsync(s => s.ProviderId == currentUserId && s.IsActive);

            var dto = new ProviderAnalyticsDto
            {
                ProviderId = currentUserId,
                ProviderName = "", // We'll need to get this from user data
                TotalBookings = totalBookings,
                TotalRevenue = totalRevenue,
                CompletedBookings = bookings.Count(b => b.Status == BookingStatus.Completed),
                CancelledBookings = bookings.Count(b => b.Status == BookingStatus.Cancelled),
                AverageRating = averageRating,
                TotalReviews = totalReviews,
                RevenueGrowth = 0, // Calculate if needed
                BookingGrowth = 0, // Calculate if needed
                TopServices = bookings
                    .GroupBy(b => new { b.Service.Id, b.Service.Name })
                    .Select(g => new ServiceAnalyticsDto
                    {
                        ServiceId = g.Key.Id.ToString(),
                        ServiceName = g.Key.Name,
                        BookingCount = g.Count(),
                        Revenue = g.Sum(b => b.TotalPrice),
                        AverageRating = 0, // Calculate from reviews if needed
                        AveragePrice = g.Average(b => b.TotalPrice)
                    })
                    .OrderByDescending(s => s.BookingCount)
                    .Take(10)
                    .ToList(),
                RevenueHistory = bookings
                    .GroupBy(b => b.CreatedAt.Date)
                    .Select(g => new RevenueDataPoint
                    {
                        Date = g.Key.ToString("yyyy-MM-dd"),
                        Amount = g.Sum(b => b.TotalPrice)
                    })
                    .OrderBy(r => r.Date)
                    .ToList(),
                BookingHistory = bookings
                    .GroupBy(b => b.CreatedAt.Date)
                    .Select(g => new BookingDataPoint
                    {
                        Date = g.Key.ToString("yyyy-MM-dd"),
                        Count = g.Count()
                    })
                    .OrderBy(b => b.Date)
                    .ToList()
            };

            return Ok(dto);
        }

        private async Task<ProviderProfileDto> MapToProviderProfileDto(Models.ServiceProvider provider)
        {
            var specialties = await _context.ProviderSpecialties
                .Where(ps => ps.ProviderId == provider.UserId)
                .Select(ps => ps.Name)
                .ToListAsync();

            var portfolio = await _context.ProviderPortfolios
                .Where(pp => pp.ProviderId == provider.UserId)
                .OrderBy(pp => pp.DisplayOrder)
                .Select(pp => new PortfolioImageDto
                {
                    Id = pp.Id,
                    ImageUrl = pp.ImageUrl,
                    Caption = pp.Caption,
                    Category = pp.Category,
                    DisplayOrder = pp.DisplayOrder,
                    CreatedAt = pp.CreatedAt
                })
                .ToListAsync();

            var businessHours = await _context.ProviderBusinessHours
                .Where(pbh => pbh.ProviderId == provider.UserId)
                .OrderBy(pbh => pbh.DayOfWeek)
                .Select(pbh => new BusinessHoursDto
                {
                    Id = pbh.Id,
                    DayOfWeek = (int)pbh.DayOfWeek,
                    IsOpen = pbh.IsOpen,
                    OpenTime = pbh.OpenTime.HasValue ? pbh.OpenTime.Value.ToString(@"hh\:mm") : null,
                    CloseTime = pbh.CloseTime.HasValue ? pbh.CloseTime.Value.ToString(@"hh\:mm") : null
                })
                .ToListAsync();

            return new ProviderProfileDto
            {
                Id = provider.Id,
                UserId = provider.UserId,
                BusinessName = provider.BusinessName,
                BusinessDescription = provider.BusinessDescription,
                BusinessAddress = provider.BusinessAddress,
                BusinessPhone = provider.BusinessPhone,
                BusinessEmail = provider.BusinessEmail,
                BusinessWebsite = provider.BusinessWebsite,
                IsVerified = provider.IsVerified,
                Specialties = specialties,
                Portfolio = portfolio,
                BusinessHours = businessHours,
                CreatedAt = provider.CreatedAt,
                UpdatedAt = provider.UpdatedAt
            };
        }
    }

    public class DeleteImageRequest
    {
        public string ImageUrl { get; set; } = string.Empty;
    }
}
