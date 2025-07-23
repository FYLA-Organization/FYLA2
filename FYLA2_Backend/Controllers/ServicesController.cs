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
  public class ServicesController : ControllerBase
  {
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ServicesController> _logger;

    public ServicesController(ApplicationDbContext context, ILogger<ServicesController> logger)
    {
      _context = context;
      _logger = logger;
    }

    // GET: api/services
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<object>>> GetServices([FromQuery] string? providerId = null, [FromQuery] string? category = null)
    {
      var query = _context.Services
          .Include(s => s.Provider)
          .Where(s => s.IsActive)
          .AsQueryable();

      // Filter by provider if specified
      if (!string.IsNullOrEmpty(providerId))
      {
        query = query.Where(s => s.ProviderId == providerId);
      }

      // Filter by category if specified
      if (!string.IsNullOrEmpty(category))
      {
        query = query.Where(s => s.Category.ToLower() == category.ToLower());
      }

      var services = await query
          .OrderBy(s => s.Name)
          .Select(s => new
          {
            id = s.Id.ToString(),
            serviceProviderId = s.ProviderId,
            name = s.Name,
            description = s.Description,
            duration = s.DurationMinutes,
            price = s.Price,
            category = s.Category,
            isActive = s.IsActive,
            imageUrl = s.ImageUrl,
            serviceProvider = new
            {
              id = s.Provider.Id,
              businessName = $"{s.Provider.FirstName} {s.Provider.LastName}",
              averageRating = 4.5, // TODO: Calculate from reviews
              totalReviews = 0, // TODO: Count from reviews
              profilePictureUrl = s.Provider.ProfileImageUrl
            }
          })
          .ToListAsync();

      return Ok(services);
    }

    // GET: api/services/{id}
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<object>> GetService(int id)
    {
      var service = await _context.Services
          .Include(s => s.Provider)
          .Include(s => s.Reviews)
          .ThenInclude(r => r.Reviewer)
          .Where(s => s.Id == id && s.IsActive)
          .Select(s => new
          {
            id = s.Id.ToString(),
            serviceProviderId = s.ProviderId,
            name = s.Name,
            description = s.Description,
            duration = s.DurationMinutes,
            price = s.Price,
            category = s.Category,
            isActive = s.IsActive,
            imageUrl = s.ImageUrl,
            serviceProvider = new
            {
              id = s.Provider.Id,
              businessName = $"{s.Provider.FirstName} {s.Provider.LastName}",
              averageRating = s.Reviews.Any() ? s.Reviews.Average(r => r.Rating) : 0,
              totalReviews = s.Reviews.Count(),
              profilePictureUrl = s.Provider.ProfileImageUrl,
              bio = s.Provider.Bio
            },
            reviews = s.Reviews.Take(5).Select(r => new
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
          })
          .FirstOrDefaultAsync();

      if (service == null)
        return NotFound();

      return Ok(service);
    }

    // GET: api/services/search
    [HttpGet("search")]
    [AllowAnonymous]
    public async Task<ActionResult<object>> SearchServices(
        [FromQuery] string? query = null,
        [FromQuery] string? category = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
      var servicesQuery = _context.Services
          .Include(s => s.Provider)
          .Where(s => s.IsActive)
          .AsQueryable();

      // Text search
      if (!string.IsNullOrEmpty(query))
      {
        servicesQuery = servicesQuery.Where(s =>
            s.Name.ToLower().Contains(query.ToLower()) ||
            s.Description!.ToLower().Contains(query.ToLower()) ||
            s.Category.ToLower().Contains(query.ToLower()) ||
            s.Provider.FirstName.ToLower().Contains(query.ToLower()) ||
            s.Provider.LastName.ToLower().Contains(query.ToLower()));
      }

      // Category filter
      if (!string.IsNullOrEmpty(category))
      {
        servicesQuery = servicesQuery.Where(s => s.Category.ToLower() == category.ToLower());
      }

      // Price range filter
      if (minPrice.HasValue)
      {
        servicesQuery = servicesQuery.Where(s => s.Price >= minPrice.Value);
      }
      if (maxPrice.HasValue)
      {
        servicesQuery = servicesQuery.Where(s => s.Price <= maxPrice.Value);
      }

      var totalCount = await servicesQuery.CountAsync();
      var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

      var services = await servicesQuery
          .Skip((page - 1) * pageSize)
          .Take(pageSize)
          .Select(s => new
          {
            id = s.Id.ToString(),
            serviceProviderId = s.ProviderId,
            name = s.Name,
            description = s.Description,
            duration = s.DurationMinutes,
            price = s.Price,
            category = s.Category,
            imageUrl = s.ImageUrl,
            serviceProvider = new
            {
              id = s.Provider.Id,
              businessName = $"{s.Provider.FirstName} {s.Provider.LastName}",
              averageRating = 4.5, // TODO: Calculate from reviews
              totalReviews = 0, // TODO: Count from reviews
              profilePictureUrl = s.Provider.ProfileImageUrl
            }
          })
          .ToListAsync();

      // Sort in memory to avoid SQLite decimal ordering issues
      var sortedServices = services.OrderBy(s => s.price).ToList();

      var result = new
      {
        data = sortedServices,
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

    // GET: api/services/categories
    [HttpGet("categories")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<object>>> GetCategories()
    {
      var categories = await _context.Services
          .Where(s => s.IsActive)
          .GroupBy(s => s.Category)
          .Select(g => new
          {
            name = g.Key,
            count = g.Count(),
            averagePrice = g.Average(s => s.Price)
          })
          .OrderBy(c => c.name)
          .ToListAsync();

      return Ok(categories);
    }

    // POST: api/services
    [HttpPost]
    public async Task<ActionResult<object>> CreateService([FromBody] CreateServiceRequest request)
    {
      var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (string.IsNullOrEmpty(userId))
        return Unauthorized();

      // Verify user is a service provider
      var user = await _context.Users.FindAsync(userId);
      if (user == null || !user.IsServiceProvider)
        return Forbid("Only service providers can create services");

      // Validate the request
      if (string.IsNullOrWhiteSpace(request.Name))
        return BadRequest("Service name is required");

      if (request.DurationMinutes <= 0)
        return BadRequest("Duration must be greater than 0");

      if (request.Price <= 0)
        return BadRequest("Price must be greater than 0");

      var service = new Service
      {
        ProviderId = userId,
        Name = request.Name.Trim(),
        Description = request.Description?.Trim(),
        DurationMinutes = request.DurationMinutes,
        Price = request.Price,
        Category = request.Category?.Trim() ?? "General",
        IsActive = true,
        ImageUrl = request.ImageUrl?.Trim(),
        CreatedAt = DateTime.UtcNow
      };

      _context.Services.Add(service);
      await _context.SaveChangesAsync();

      var createdService = new
      {
        id = service.Id.ToString(),
        serviceProviderId = service.ProviderId,
        name = service.Name,
        description = service.Description,
        duration = service.DurationMinutes,
        price = service.Price,
        category = service.Category,
        isActive = service.IsActive,
        imageUrl = service.ImageUrl,
        createdAt = service.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
      };

      return CreatedAtAction(nameof(GetService), new { id = service.Id }, createdService);
    }

    // PUT: api/services/{id}
    [HttpPut("{id}")]
    public async Task<ActionResult<object>> UpdateService(int id, [FromBody] UpdateServiceRequest request)
    {
      var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (string.IsNullOrEmpty(userId))
        return Unauthorized();

      var service = await _context.Services.FindAsync(id);
      if (service == null)
        return NotFound();

      // Only the service provider can update their own services
      if (service.ProviderId != userId)
        return Forbid();

      // Validate the request
      if (string.IsNullOrWhiteSpace(request.Name))
        return BadRequest("Service name is required");

      if (request.DurationMinutes <= 0)
        return BadRequest("Duration must be greater than 0");

      if (request.Price <= 0)
        return BadRequest("Price must be greater than 0");

      // Update the service
      service.Name = request.Name.Trim();
      service.Description = request.Description?.Trim();
      service.DurationMinutes = request.DurationMinutes;
      service.Price = request.Price;
      service.Category = request.Category?.Trim() ?? service.Category;
      service.ImageUrl = request.ImageUrl?.Trim();
      service.UpdatedAt = DateTime.UtcNow;

      await _context.SaveChangesAsync();

      var updatedService = new
      {
        id = service.Id.ToString(),
        serviceProviderId = service.ProviderId,
        name = service.Name,
        description = service.Description,
        duration = service.DurationMinutes,
        price = service.Price,
        category = service.Category,
        isActive = service.IsActive,
        imageUrl = service.ImageUrl,
        updatedAt = service.UpdatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
      };

      return Ok(updatedService);
    }

    // DELETE: api/services/{id}
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteService(int id)
    {
      var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (string.IsNullOrEmpty(userId))
        return Unauthorized();

      var service = await _context.Services.FindAsync(id);
      if (service == null)
        return NotFound();

      // Only the service provider can delete their own services
      if (service.ProviderId != userId)
        return Forbid();

      // Check if there are any active bookings for this service
      var hasActiveBookings = await _context.Bookings
          .AnyAsync(b => b.ServiceId == id &&
                        (b.Status == BookingStatus.Pending ||
                         b.Status == BookingStatus.Confirmed ||
                         b.Status == BookingStatus.InProgress));

      if (hasActiveBookings)
      {
        // Soft delete - just mark as inactive
        service.IsActive = false;
        service.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(new { message = "Service deactivated due to active bookings" });
      }
      else
      {
        // Hard delete if no active bookings
        _context.Services.Remove(service);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Service deleted successfully" });
      }
    }

    // PUT: api/services/{id}/toggle-active
    [HttpPut("{id}/toggle-active")]
    public async Task<ActionResult<object>> ToggleServiceActive(int id)
    {
      var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (string.IsNullOrEmpty(userId))
        return Unauthorized();

      var service = await _context.Services.FindAsync(id);
      if (service == null)
        return NotFound();

      // Only the service provider can toggle their own services
      if (service.ProviderId != userId)
        return Forbid();

      service.IsActive = !service.IsActive;
      service.UpdatedAt = DateTime.UtcNow;

      await _context.SaveChangesAsync();

      return Ok(new
      {
        id = service.Id.ToString(),
        isActive = service.IsActive,
        message = service.IsActive ? "Service activated" : "Service deactivated"
      });
    }
  }

  // DTOs for requests
  public class CreateServiceRequest
  {
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DurationMinutes { get; set; } // in minutes
    public decimal Price { get; set; }
    public string? Category { get; set; }
    public string? ImageUrl { get; set; }
  }

  public class UpdateServiceRequest
  {
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DurationMinutes { get; set; } // in minutes
    public decimal Price { get; set; }
    public string? Category { get; set; }
    public string? ImageUrl { get; set; }
  }
}
