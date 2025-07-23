using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYLA2_Backend.Data;
using FYLA2_Backend.Models;
using System.Security.Claims;

namespace FYLA2_Backend.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  [Authorize]
  public class ServiceProviderController : ControllerBase
  {
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ServiceProviderController> _logger;

    public ServiceProviderController(ApplicationDbContext context, ILogger<ServiceProviderController> logger)
    {
      _context = context;
      _logger = logger;
    }

    // GET: api/serviceprovider
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<object>> GetServiceProviders(
        [FromQuery] string? query = null,
        [FromQuery] string? category = null,
        [FromQuery] string? location = null,
        [FromQuery] decimal? minRating = null,
        [FromQuery] decimal? priceMin = null,
        [FromQuery] decimal? priceMax = null,
        [FromQuery] string? distance = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
      var providersQuery = _context.Users
          .Include(u => u.Services)
          .Include(u => u.ReviewsReceived)
          .Where(u => u.IsServiceProvider)
          .AsQueryable();

      // Text search
      if (!string.IsNullOrEmpty(query))
      {
        providersQuery = providersQuery.Where(u =>
            u.FirstName.ToLower().Contains(query.ToLower()) ||
            u.LastName.ToLower().Contains(query.ToLower()) ||
            (u.Bio != null && u.Bio.ToLower().Contains(query.ToLower())) ||
            u.Services.Any(s => s.Name.ToLower().Contains(query.ToLower()) ||
                               s.Category.ToLower().Contains(query.ToLower())));
      }

      // Category filter
      if (!string.IsNullOrEmpty(category))
      {
        providersQuery = providersQuery.Where(u =>
            u.Services.Any(s => s.Category.ToLower() == category.ToLower()));
      }

      // Location filter (placeholder for now)
      if (!string.IsNullOrEmpty(location))
      {
        // TODO: Implement location-based filtering
      }

      // Rating filter - need to handle this differently for SQLite
      if (minRating.HasValue)
      {
        // For SQLite compatibility, we'll filter this after the query
        // providersQuery = providersQuery.Where(u =>
        //     u.ReviewsReceived.Any() &&
        //     u.ReviewsReceived.Average(r => r.Rating) >= (double)minRating.Value);
      }

      // Get total count before pagination
      var totalCount = await providersQuery.CountAsync();

      // Apply pagination and get basic provider data
      var providerData = await providersQuery
          .Skip((page - 1) * pageSize)
          .Take(pageSize)
          .Include(u => u.ReviewsReceived)
          .Include(u => u.Services)
          .ToListAsync();

      // Process the data in memory to calculate averages (SQLite-friendly)
      var providers = providerData.Select(u => new
      {
        id = u.Id,
        businessName = $"{u.FirstName} {u.LastName}",
        businessDescription = u.Bio ?? "Professional Services",
        profilePictureUrl = u.ProfileImageUrl,
        averageRating = u.ReviewsReceived.Any() ? u.ReviewsReceived.Average(r => r.Rating) : 0.0,
        totalReviews = u.ReviewsReceived.Count,
        priceRange = "$$", // TODO: Calculate based on services
        specialties = u.Services.Select(s => s.Category).Distinct().ToList(),
        verified = true // TODO: Implement verification system
      }).ToList();

      // Apply rating filter in memory if specified
      if (minRating.HasValue)
      {
        providers = providers.Where(p => p.averageRating >= (double)minRating.Value).ToList();
        totalCount = providers.Count; // Update total count after filtering
      }

      var response = new
      {
        data = providers,
        pagination = new
        {
          page,
          pageSize,
          totalCount,
          totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        }
      };

      return Ok(response);
    }

    // GET: api/serviceprovider/search
    [HttpGet("search")]
    [AllowAnonymous]
    public async Task<ActionResult<object>> SearchServiceProviders(
        [FromQuery] string? query = null,
        [FromQuery] string? category = null,
        [FromQuery] string? location = null,
        [FromQuery] decimal? minRating = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
      var providersQuery = _context.Users
          .Include(u => u.Services)
          .Include(u => u.ReviewsReceived)
          .Where(u => u.IsServiceProvider)
          .AsQueryable();

      // Text search
      if (!string.IsNullOrEmpty(query))
      {
        providersQuery = providersQuery.Where(u =>
            u.FirstName.ToLower().Contains(query.ToLower()) ||
            u.LastName.ToLower().Contains(query.ToLower()) ||
            (u.Bio != null && u.Bio.ToLower().Contains(query.ToLower())) ||
            u.Services.Any(s => s.Name.ToLower().Contains(query.ToLower()) ||
                               s.Category.ToLower().Contains(query.ToLower())));
      }

      // Category filter (based on services offered)
      if (!string.IsNullOrEmpty(category))
      {
        providersQuery = providersQuery.Where(u =>
            u.Services.Any(s => s.Category.ToLower() == category.ToLower() && s.IsActive));
      }

      // Rating filter
      if (minRating.HasValue)
      {
        providersQuery = providersQuery.Where(u =>
            u.ReviewsReceived.Any() && (decimal)u.ReviewsReceived.Average(r => r.Rating) >= minRating.Value);
      }

      var totalCount = await providersQuery.CountAsync();
      var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

      var rawProviders = await providersQuery
          .Include(u => u.Services.Where(s => s.IsActive))
          .Include(u => u.ReviewsReceived)
          .OrderByDescending(u => u.ReviewsReceived.Any() ? u.ReviewsReceived.Average(r => r.Rating) : 0)
          .Skip((page - 1) * pageSize)
          .Take(pageSize)
          .ToListAsync();

      var providers = rawProviders.Select(u =>
      {
        var activeServices = u.Services.Where(s => s.IsActive).ToList();
        var priceRange = activeServices.Any() ?
          $"${activeServices.Min(s => s.Price)} - ${activeServices.Max(s => s.Price)}" :
          "$0 - $0";

        return new
        {
          id = u.Id,
          userId = u.Id,
          businessName = $"{u.FirstName} {u.LastName}",
          businessDescription = u.Bio,
          averageRating = u.ReviewsReceived.Any() ? Math.Round(u.ReviewsReceived.Average(r => r.Rating), 1) : 0.0,
          totalReviews = u.ReviewsReceived.Count(),
          isVerified = false, // TODO: Add verification system
          profilePictureUrl = u.ProfileImageUrl,
          specialties = activeServices.Select(s => s.Category).Distinct().ToList(),
          priceRange = priceRange,
          serviceCount = activeServices.Count,
          user = new
          {
            id = u.Id,
            firstName = u.FirstName,
            lastName = u.LastName,
            email = u.Email,
            profileImageUrl = u.ProfileImageUrl,
            bio = u.Bio,
            isServiceProvider = u.IsServiceProvider
          }
        };
      }).ToList();

      var result = new
      {
        data = providers,
        pagination = new
        {
          currentPage = page,
          pageSize = pageSize,
          totalPages = totalPages,
          totalCount = totalCount,
          hasNextPage = page < totalPages,
          hasPreviousPage = page > 1
        }
      };

      return Ok(result);
    }

    // GET: api/serviceprovider/{id}
    // GET: api/serviceprovider/{id}
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<object>> GetServiceProvider(string id)
    {
      var rawProvider = await _context.Users
          .Include(u => u.Services.Where(s => s.IsActive))
          .Include(u => u.ReviewsReceived)
          .ThenInclude(r => r.Reviewer)
          .Where(u => u.Id == id && u.IsServiceProvider)
          .FirstOrDefaultAsync();

      if (rawProvider == null)
        return NotFound("Service provider not found");

      var activeServices = rawProvider.Services.Where(s => s.IsActive).ToList();
      var priceRange = activeServices.Any() ?
        $"${activeServices.Min(s => s.Price)} - ${activeServices.Max(s => s.Price)}" :
        "$0 - $0";

      var provider = new
      {
        id = rawProvider.Id,
        userId = rawProvider.Id,
        businessName = $"{rawProvider.FirstName} {rawProvider.LastName}",
        businessDescription = rawProvider.Bio,
        averageRating = rawProvider.ReviewsReceived.Any() ? Math.Round(rawProvider.ReviewsReceived.Average(r => r.Rating), 1) : 0.0,
        totalReviews = rawProvider.ReviewsReceived.Count(),
        isVerified = false, // TODO: Add verification system
        profilePictureUrl = rawProvider.ProfileImageUrl,
        specialties = activeServices.Select(s => s.Category).Distinct().ToList(),
        priceRange = priceRange,
        user = new
        {
          id = rawProvider.Id,
          firstName = rawProvider.FirstName,
          lastName = rawProvider.LastName,
          email = rawProvider.Email,
          profileImageUrl = rawProvider.ProfileImageUrl,
          bio = rawProvider.Bio,
          dateOfBirth = rawProvider.DateOfBirth?.ToString("yyyy-MM-dd"),
          isServiceProvider = rawProvider.IsServiceProvider,
          createdAt = rawProvider.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
        },
        services = rawProvider.Services.Where(s => s.IsActive).Select(s => new
        {
          id = s.Id.ToString(),
          name = s.Name,
          description = s.Description,
          duration = s.DurationMinutes,
          price = s.Price,
          category = s.Category,
          imageUrl = s.ImageUrl
        }).ToList(),
        reviews = rawProvider.ReviewsReceived.OrderByDescending(r => r.CreatedAt).Take(10).Select(r => new
        {
          id = r.Id.ToString(),
          rating = r.Rating,
          comment = r.Comment,
          createdAt = r.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
          reviewer = new
          {
            firstName = r.Reviewer.FirstName,
            lastName = r.Reviewer.LastName,
            profilePictureUrl = r.Reviewer.ProfileImageUrl
          }
        }).ToList()
      };

      return Ok(provider);
    }

    // GET: api/serviceprovider/me
    [HttpGet("me")]
    public async Task<ActionResult<object>> GetMyProfile()
    {
      var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (string.IsNullOrEmpty(userId))
        return Unauthorized();

      var user = await _context.Users.FindAsync(userId);
      if (user == null || !user.IsServiceProvider)
        return NotFound("Service provider profile not found");

      // Get provider statistics
      var services = await _context.Services.Where(s => s.ProviderId == userId).ToListAsync();
      var bookings = await _context.Bookings.Where(b => b.ProviderId == userId).ToListAsync();
      var reviews = await _context.Reviews.Where(r => r.RevieweeId == userId).ToListAsync();

      var profile = new
      {
        id = user.Id,
        userId = user.Id,
        businessName = $"{user.FirstName} {user.LastName}",
        businessDescription = user.Bio,
        averageRating = reviews.Any() ? Math.Round(reviews.Average(r => r.Rating), 1) : 0.0,
        totalReviews = reviews.Count,
        isVerified = false, // TODO: Add verification system
        profilePictureUrl = user.ProfileImageUrl,
        user = new
        {
          id = user.Id,
          firstName = user.FirstName,
          lastName = user.LastName,
          email = user.Email,
          profileImageUrl = user.ProfileImageUrl,
          bio = user.Bio,
          dateOfBirth = user.DateOfBirth?.ToString("yyyy-MM-dd"),
          isServiceProvider = user.IsServiceProvider,
          createdAt = user.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
        },
        statistics = new
        {
          totalServices = services.Count(s => s.IsActive),
          totalBookings = bookings.Count,
          completedBookings = bookings.Count(b => b.Status == BookingStatus.Completed),
          totalRevenue = bookings.Where(b => b.Status == BookingStatus.Completed).Sum(b => b.TotalPrice),
          thisMonthBookings = bookings.Count(b => b.BookingDate.Month == DateTime.Now.Month && b.BookingDate.Year == DateTime.Now.Year),
          thisMonthRevenue = bookings.Where(b => b.Status == BookingStatus.Completed &&
                                                b.BookingDate.Month == DateTime.Now.Month &&
                                                b.BookingDate.Year == DateTime.Now.Year)
                                               .Sum(b => b.TotalPrice)
        }
      };

      return Ok(profile);
    }

    // PUT: api/serviceprovider
    [HttpPut]
    public async Task<ActionResult<object>> UpdateProfile([FromBody] UpdateServiceProviderRequest request)
    {
      var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (string.IsNullOrEmpty(userId))
        return Unauthorized();

      var user = await _context.Users.FindAsync(userId);
      if (user == null)
        return NotFound("User not found");

      if (!user.IsServiceProvider)
        return BadRequest("User is not a service provider");

      // Update user fields
      if (!string.IsNullOrWhiteSpace(request.FirstName))
        user.FirstName = request.FirstName.Trim();

      if (!string.IsNullOrWhiteSpace(request.LastName))
        user.LastName = request.LastName.Trim();

      if (!string.IsNullOrWhiteSpace(request.Bio))
        user.Bio = request.Bio.Trim();

      if (!string.IsNullOrWhiteSpace(request.ProfileImageUrl))
        user.ProfileImageUrl = request.ProfileImageUrl.Trim();

      if (request.DateOfBirth.HasValue)
        user.DateOfBirth = request.DateOfBirth.Value;

      await _context.SaveChangesAsync();

      var updatedProfile = new
      {
        id = user.Id,
        businessName = $"{user.FirstName} {user.LastName}",
        businessDescription = user.Bio,
        profilePictureUrl = user.ProfileImageUrl,
        user = new
        {
          id = user.Id,
          firstName = user.FirstName,
          lastName = user.LastName,
          email = user.Email,
          profileImageUrl = user.ProfileImageUrl,
          bio = user.Bio,
          dateOfBirth = user.DateOfBirth?.ToString("yyyy-MM-dd"),
          isServiceProvider = user.IsServiceProvider
        }
      };

      return Ok(updatedProfile);
    }

    // GET: api/serviceprovider/{id}/services
    [HttpGet("{id}/services")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<object>>> GetProviderServices(string id)
    {
      var provider = await _context.Users.FindAsync(id);
      if (provider == null || !provider.IsServiceProvider)
        return NotFound("Service provider not found");

      var services = await _context.Services
          .Where(s => s.ProviderId == id && s.IsActive)
          .Select(s => new
          {
            id = s.Id.ToString(),
            name = s.Name,
            description = s.Description,
            duration = s.DurationMinutes,
            price = s.Price,
            category = s.Category,
            imageUrl = s.ImageUrl,
            isActive = s.IsActive
          })
          .ToListAsync();

      // Sort in memory to avoid SQLite decimal ordering issues
      var sortedServices = services
          .OrderBy(s => s.category)
          .ThenBy(s => s.price)
          .ToList();

      return Ok(sortedServices);
    }

    // GET: api/serviceprovider/{id}/reviews
    [HttpGet("{id}/reviews")]
    [AllowAnonymous]
    public async Task<ActionResult<object>> GetProviderReviews(string id, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
      var provider = await _context.Users.FindAsync(id);
      if (provider == null || !provider.IsServiceProvider)
        return NotFound("Service provider not found");

      var reviewsQuery = _context.Reviews
          .Include(r => r.Reviewer)
          .Where(r => r.RevieweeId == id);

      var totalCount = await reviewsQuery.CountAsync();
      var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

      var reviews = await reviewsQuery
          .OrderByDescending(r => r.CreatedAt)
          .Skip((page - 1) * pageSize)
          .Take(pageSize)
          .Select(r => new
          {
            id = r.Id.ToString(),
            rating = r.Rating,
            comment = r.Comment,
            createdAt = r.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
            reviewer = new
            {
              firstName = r.Reviewer.FirstName,
              lastName = r.Reviewer.LastName,
              profilePictureUrl = r.Reviewer.ProfileImageUrl
            }
          })
          .ToListAsync();

      var result = new
      {
        data = reviews,
        pagination = new
        {
          currentPage = page,
          pageSize = pageSize,
          totalPages = totalPages,
          totalCount = totalCount,
          hasNextPage = page < totalPages,
          hasPreviousPage = page > 1
        },
        summary = new
        {
          totalReviews = totalCount,
          averageRating = totalCount > 0 ? Math.Round(await reviewsQuery.AverageAsync(r => r.Rating), 1) : 0.0,
          ratingDistribution = await reviewsQuery
                  .GroupBy(r => r.Rating)
                  .Select(g => new { rating = g.Key, count = g.Count() })
                  .OrderByDescending(x => x.rating)
                  .ToListAsync()
        }
      };

      return Ok(result);
    }

    // GET: api/serviceprovider/featured
    [HttpGet("featured")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<object>>> GetFeaturedProviders([FromQuery] int count = 6)
    {
      var providers = await _context.Users
          .Include(u => u.Services.Where(s => s.IsActive))
          .Include(u => u.ReviewsReceived)
          .Where(u => u.IsServiceProvider && u.Services.Any(s => s.IsActive))
          .Take(count)
          .ToListAsync();

      var result = providers.Select(u =>
      {
        var activeServices = u.Services.Where(s => s.IsActive).ToList();
        var priceRange = activeServices.Any() ?
          $"${activeServices.Min(s => s.Price)} - ${activeServices.Max(s => s.Price)}" :
          "$0 - $0";

        return new
        {
          id = u.Id,
          businessName = $"{u.FirstName} {u.LastName}",
          averageRating = u.ReviewsReceived.Any() ? Math.Round(u.ReviewsReceived.Average(r => r.Rating), 1) : 0.0,
          totalReviews = u.ReviewsReceived.Count(),
          profilePictureUrl = u.ProfileImageUrl,
          specialties = activeServices.Select(s => s.Category).Distinct().Take(3).ToList(),
          priceRange = priceRange
        };
      }).ToList();

      return Ok(result);
    }
  }

  // DTOs for requests
  public class UpdateServiceProviderRequest
  {
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Bio { get; set; }
    public string? ProfileImageUrl { get; set; }
    public DateTime? DateOfBirth { get; set; }
  }
}
