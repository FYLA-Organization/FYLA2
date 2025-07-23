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
  public class BookingsController : ControllerBase
  {
    private readonly ApplicationDbContext _context;
    private readonly ILogger<BookingsController> _logger;

    public BookingsController(ApplicationDbContext context, ILogger<BookingsController> logger)
    {
      _context = context;
      _logger = logger;
    }

    // GET: api/bookings/my-bookings
    [HttpGet("my-bookings")]
    public async Task<ActionResult<IEnumerable<object>>> GetMyBookings([FromQuery] string? status = null)
    {
      var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (string.IsNullOrEmpty(userId))
        return Unauthorized();

      var user = await _context.Users.FindAsync(userId);
      if (user == null)
        return NotFound("User not found");

      var query = _context.Bookings
          .Include(b => b.Service)
          .Include(b => b.Client)
          .Include(b => b.Provider)
          .AsQueryable();

      // Filter by user role
      if (user.IsServiceProvider)
      {
        query = query.Where(b => b.ProviderId == userId);
      }
      else
      {
        query = query.Where(b => b.ClientId == userId);
      }

      // Filter by status if provided
      if (!string.IsNullOrEmpty(status) && Enum.TryParse<BookingStatus>(status, true, out var bookingStatus))
      {
        query = query.Where(b => b.Status == bookingStatus);
      }

      var bookings = await query
          .OrderByDescending(b => b.BookingDate)
          .Select(b => new
          {
            id = b.Id.ToString(),
            clientId = b.ClientId,
            serviceProviderId = b.ProviderId,
            serviceId = b.ServiceId.ToString(),
            bookingDate = b.BookingDate.ToString("yyyy-MM-dd"),
            startTime = b.StartTime.ToString("HH:mm"),
            endTime = b.EndTime.ToString("HH:mm"),
            status = b.Status.ToString(),
            totalAmount = b.TotalPrice,
            notes = b.Notes,
            cancellationReason = "", // TODO: Add cancellation reason field
            createdAt = b.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
            client = user.IsServiceProvider ? new
            {
              id = b.Client.Id,
              email = b.Client.Email,
              firstName = b.Client.FirstName,
              lastName = b.Client.LastName,
              profilePictureUrl = b.Client.ProfileImageUrl
            } : null,
            serviceProvider = !user.IsServiceProvider ? new
            {
              id = b.Provider.Id,
              businessName = $"{b.Provider.FirstName} {b.Provider.LastName}", // TODO: Add business name field
              profilePictureUrl = b.Provider.ProfileImageUrl
            } : null,
            service = new
            {
              id = b.Service.Id.ToString(),
              name = b.Service.Name,
              description = b.Service.Description,
              duration = b.Service.DurationMinutes,
              price = b.Service.Price,
              category = b.Service.Category
            }
          })
          .ToListAsync();

      return Ok(bookings);
    }

    // GET: api/bookings/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<object>> GetBooking(int id)
    {
      var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (string.IsNullOrEmpty(userId))
        return Unauthorized();

      var booking = await _context.Bookings
          .Include(b => b.Service)
          .Include(b => b.Client)
          .Include(b => b.Provider)
          .Where(b => b.Id == id && (b.ClientId == userId || b.ProviderId == userId))
          .Select(b => new
          {
            id = b.Id.ToString(),
            clientId = b.ClientId,
            serviceProviderId = b.ProviderId,
            serviceId = b.ServiceId.ToString(),
            bookingDate = b.BookingDate.ToString("yyyy-MM-dd"),
            startTime = b.StartTime.ToString("HH:mm"),
            endTime = b.EndTime.ToString("HH:mm"),
            status = b.Status.ToString(),
            totalAmount = b.TotalPrice,
            notes = b.Notes,
            createdAt = b.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
            client = new
            {
              id = b.Client.Id,
              email = b.Client.Email,
              firstName = b.Client.FirstName,
              lastName = b.Client.LastName,
              profilePictureUrl = b.Client.ProfileImageUrl
            },
            serviceProvider = new
            {
              id = b.Provider.Id,
              businessName = $"{b.Provider.FirstName} {b.Provider.LastName}",
              profilePictureUrl = b.Provider.ProfileImageUrl
            },
            service = new
            {
              id = b.Service.Id.ToString(),
              name = b.Service.Name,
              description = b.Service.Description,
              duration = b.Service.DurationMinutes,
              price = b.Service.Price,
              category = b.Service.Category
            }
          })
          .FirstOrDefaultAsync();

      if (booking == null)
        return NotFound();

      return Ok(booking);
    }

    // POST: api/bookings
    [HttpPost]
    public async Task<ActionResult<object>> CreateBooking([FromBody] CreateBookingRequest request)
    {
      var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (string.IsNullOrEmpty(userId))
        return Unauthorized();

      // Validate the service exists
      var service = await _context.Services.FindAsync(request.ServiceId);
      if (service == null)
        return BadRequest("Service not found");

      // Validate the provider exists
      var provider = await _context.Users.FindAsync(request.ServiceProviderId);
      if (provider == null || !provider.IsServiceProvider)
        return BadRequest("Service provider not found");

      // Validate booking date and time
      if (!DateTime.TryParse(request.BookingDate, out var bookingDate))
        return BadRequest("Invalid booking date");

      if (!TimeSpan.TryParse(request.StartTime, out var startTime))
        return BadRequest("Invalid start time");

      var startDateTime = bookingDate.Date + startTime;
      var endDateTime = startDateTime.AddMinutes(service.DurationMinutes);

      // Check if the time slot is available
      var conflictingBooking = await _context.Bookings
          .Where(b => b.ProviderId == request.ServiceProviderId &&
                     b.BookingDate.Date == bookingDate.Date &&
                     b.Status != BookingStatus.Cancelled &&
                     ((b.StartTime <= startDateTime && b.EndTime > startDateTime) ||
                      (b.StartTime < endDateTime && b.EndTime >= endDateTime) ||
                      (b.StartTime >= startDateTime && b.EndTime <= endDateTime)))
          .FirstOrDefaultAsync();

      if (conflictingBooking != null)
        return BadRequest("Time slot is not available");

      // Create the booking
      var booking = new Booking
      {
        ClientId = userId,
        ProviderId = request.ServiceProviderId,
        ServiceId = request.ServiceId,
        BookingDate = bookingDate,
        StartTime = startDateTime,
        EndTime = endDateTime,
        Status = BookingStatus.Pending,
        TotalPrice = service.Price,
        Notes = request.Notes,
        CreatedAt = DateTime.UtcNow
      };

      _context.Bookings.Add(booking);
      await _context.SaveChangesAsync();

      // Return the created booking with related data
      var createdBooking = await _context.Bookings
          .Include(b => b.Service)
          .Include(b => b.Client)
          .Include(b => b.Provider)
          .Where(b => b.Id == booking.Id)
          .Select(b => new
          {
            id = b.Id.ToString(),
            clientId = b.ClientId,
            serviceProviderId = b.ProviderId,
            serviceId = b.ServiceId.ToString(),
            bookingDate = b.BookingDate.ToString("yyyy-MM-dd"),
            startTime = b.StartTime.ToString("HH:mm"),
            endTime = b.EndTime.ToString("HH:mm"),
            status = b.Status.ToString(),
            totalAmount = b.TotalPrice,
            notes = b.Notes,
            createdAt = b.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
            service = new
            {
              id = b.Service.Id.ToString(),
              name = b.Service.Name,
              description = b.Service.Description,
              duration = b.Service.DurationMinutes,
              price = b.Service.Price,
              category = b.Service.Category
            }
          })
          .FirstOrDefaultAsync();

      return CreatedAtAction(nameof(GetBooking), new { id = booking.Id }, createdBooking);
    }

    // PUT: api/bookings/{id}/status
    [HttpPut("{id}/status")]
    public async Task<ActionResult<object>> UpdateBookingStatus(int id, [FromBody] UpdateBookingStatusRequest request)
    {
      var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (string.IsNullOrEmpty(userId))
        return Unauthorized();

      var booking = await _context.Bookings
          .Include(b => b.Service)
          .Include(b => b.Client)
          .Include(b => b.Provider)
          .FirstOrDefaultAsync(b => b.Id == id);

      if (booking == null)
        return NotFound();

      // Only the provider can update booking status (except cancellation)
      if (booking.ProviderId != userId && request.Status != "Cancelled")
        return Forbid();

      // Clients can only cancel their own bookings
      if (booking.ClientId != userId && request.Status == "Cancelled")
        return Forbid();

      // Parse and validate the new status
      if (!Enum.TryParse<BookingStatus>(request.Status, true, out var newStatus))
        return BadRequest("Invalid status");

      // Validate status transitions
      var validTransitions = GetValidStatusTransitions(booking.Status);
      if (!validTransitions.Contains(newStatus))
        return BadRequest($"Cannot change status from {booking.Status} to {newStatus}");

      booking.Status = newStatus;
      booking.UpdatedAt = DateTime.UtcNow;

      await _context.SaveChangesAsync();

      var updatedBooking = new
      {
        id = booking.Id.ToString(),
        status = booking.Status.ToString(),
        updatedAt = booking.UpdatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
      };

      return Ok(updatedBooking);
    }

    // GET: api/bookings/availability/{providerId}
    [HttpGet("availability/{providerId}")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<string>>> GetAvailability(string providerId, [FromQuery] string date)
    {
      if (!DateTime.TryParse(date, out var requestedDate))
        return BadRequest("Invalid date format");

      // Get all bookings for the provider on the requested date
      var existingBookings = await _context.Bookings
          .Where(b => b.ProviderId == providerId &&
                     b.BookingDate.Date == requestedDate.Date &&
                     b.Status != BookingStatus.Cancelled)
          .Select(b => new { b.StartTime, b.EndTime })
          .ToListAsync();

      // Generate available time slots (9 AM to 6 PM, 30-minute intervals)
      var availableSlots = new List<string>();
      var startHour = 9;
      var endHour = 18;

      for (int hour = startHour; hour < endHour; hour++)
      {
        for (int minute = 0; minute < 60; minute += 30)
        {
          var slotTime = new DateTime(requestedDate.Year, requestedDate.Month, requestedDate.Day, hour, minute, 0);
          var slotEndTime = slotTime.AddMinutes(30);

          // Check if this slot conflicts with any existing booking
          bool isAvailable = !existingBookings.Any(booking =>
              (booking.StartTime <= slotTime && booking.EndTime > slotTime) ||
              (booking.StartTime < slotEndTime && booking.EndTime >= slotEndTime) ||
              (booking.StartTime >= slotTime && booking.EndTime <= slotEndTime));

          if (isAvailable)
          {
            availableSlots.Add(slotTime.ToString("HH:mm"));
          }
        }
      }

      return Ok(availableSlots);
    }

    // PUT: api/bookings/{id}/cancel
    [HttpPut("{id}/cancel")]
    public async Task<ActionResult<object>> CancelBooking(int id, [FromBody] CancelBookingRequest request)
    {
      var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (string.IsNullOrEmpty(userId))
        return Unauthorized();

      var booking = await _context.Bookings.FindAsync(id);
      if (booking == null)
        return NotFound();

      // Only client or provider can cancel
      if (booking.ClientId != userId && booking.ProviderId != userId)
        return Forbid();

      // Cannot cancel completed bookings
      if (booking.Status == BookingStatus.Completed)
        return BadRequest("Cannot cancel completed booking");

      booking.Status = BookingStatus.Cancelled;
      booking.Notes = string.IsNullOrEmpty(booking.Notes)
          ? $"Cancelled: {request.Reason}"
          : $"{booking.Notes}\nCancelled: {request.Reason}";
      booking.UpdatedAt = DateTime.UtcNow;

      await _context.SaveChangesAsync();

      return Ok(new { message = "Booking cancelled successfully" });
    }

    private static List<BookingStatus> GetValidStatusTransitions(BookingStatus currentStatus)
    {
      return currentStatus switch
      {
        BookingStatus.Pending => new List<BookingStatus> { BookingStatus.Confirmed, BookingStatus.Cancelled },
        BookingStatus.Confirmed => new List<BookingStatus> { BookingStatus.InProgress, BookingStatus.Cancelled },
        BookingStatus.InProgress => new List<BookingStatus> { BookingStatus.Completed, BookingStatus.Cancelled },
        BookingStatus.Completed => new List<BookingStatus>(), // Cannot change from completed
        BookingStatus.Cancelled => new List<BookingStatus>(), // Cannot change from cancelled
        _ => new List<BookingStatus>()
      };
    }
  }

  // DTOs for requests
  public class CreateBookingRequest
  {
    public string ServiceProviderId { get; set; } = string.Empty;
    public int ServiceId { get; set; }
    public string BookingDate { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string? Notes { get; set; }
  }

  public class UpdateBookingStatusRequest
  {
    public string Status { get; set; } = string.Empty;
  }

  public class CancelBookingRequest
  {
    public string Reason { get; set; } = string.Empty;
  }
}
