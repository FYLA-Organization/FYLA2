using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using FYLA2_Backend.Data;
using FYLA2_Backend.Models;
using FYLA2_Backend.DTOs.SeatRental;
using System.Security.Claims;
using System.Text.Json;

namespace FYLA2_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SeatRentalController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SeatRentalController> _logger;

        public SeatRentalController(ApplicationDbContext context, ILogger<SeatRentalController> logger)
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

        // GET: api/SeatRental/search
        [HttpPost("search")]
        [AllowAnonymous]
        public async Task<ActionResult<List<SeatRentalDto>>> SearchSeatRentals([FromBody] SeatRentalSearchDto searchDto)
        {
            try
            {
                var query = _context.SeatRentals
                    .Include(sr => sr.Owner)
                    .Include(sr => sr.Bookings.Where(b => b.Status == "active"))
                    .Where(sr => sr.IsActive);

                // Apply filters
                if (!string.IsNullOrEmpty(searchDto.City))
                {
                    query = query.Where(sr => sr.City.ToLower().Contains(searchDto.City.ToLower()));
                }

                if (!string.IsNullOrEmpty(searchDto.State))
                {
                    query = query.Where(sr => sr.State.ToLower() == searchDto.State.ToLower());
                }

                if (searchDto.MaxDailyRate.HasValue)
                {
                    query = query.Where(sr => sr.DailyRate <= searchDto.MaxDailyRate.Value);
                }

                if (searchDto.MaxWeeklyRate.HasValue)
                {
                    query = query.Where(sr => sr.WeeklyRate <= searchDto.MaxWeeklyRate.Value);
                }

                if (searchDto.MaxMonthlyRate.HasValue)
                {
                    query = query.Where(sr => sr.MonthlyRate <= searchDto.MaxMonthlyRate.Value);
                }

                // Apply amenities filter
                if (searchDto.RequiredAmenities.Any())
                {
                    foreach (var amenity in searchDto.RequiredAmenities)
                    {
                        query = query.Where(sr => sr.Amenities.Contains(amenity));
                    }
                }

                // Apply availability filter
                if (searchDto.AvailableFrom.HasValue && searchDto.AvailableTo.HasValue)
                {
                    query = query.Where(sr => !sr.Bookings.Any(b => 
                        b.Status == "active" &&
                        ((b.StartDate <= searchDto.AvailableFrom && b.EndDate >= searchDto.AvailableFrom) ||
                         (b.StartDate <= searchDto.AvailableTo && b.EndDate >= searchDto.AvailableTo) ||
                         (b.StartDate >= searchDto.AvailableFrom && b.EndDate <= searchDto.AvailableTo))));
                }

                var totalCount = await query.CountAsync();
                var seatRentals = await query
                    .Skip((searchDto.Page - 1) * searchDto.PageSize)
                    .Take(searchDto.PageSize)
                    .ToListAsync();

                var result = seatRentals.Select(MapToSeatRentalDto).ToList();

                Response.Headers.Add("X-Total-Count", totalCount.ToString());
                Response.Headers.Add("X-Page", searchDto.Page.ToString());
                Response.Headers.Add("X-PageSize", searchDto.PageSize.ToString());

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching seat rentals");
                return StatusCode(500, "An error occurred while searching seat rentals.");
            }
        }

        // GET: api/SeatRental/my-listings
        [HttpGet("my-listings")]
        public async Task<ActionResult<List<SeatRentalDto>>> GetMyListings()
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId) || !IsServiceProvider())
                {
                    return Unauthorized("Only service providers can view their listings.");
                }

                var seatRentals = await _context.SeatRentals
                    .Include(sr => sr.Owner)
                    .Include(sr => sr.Bookings)
                        .ThenInclude(b => b.Renter)
                    .Where(sr => sr.OwnerId == userId)
                    .OrderByDescending(sr => sr.CreatedAt)
                    .ToListAsync();

                var result = seatRentals.Select(MapToSeatRentalDto).ToList();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user listings for {UserId}", GetUserId());
                return StatusCode(500, "An error occurred while retrieving your listings.");
            }
        }

        // GET: api/SeatRental/my-rentals
        [HttpGet("my-rentals")]
        public async Task<ActionResult<List<SeatRentalBookingDto>>> GetMyRentals()
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId) || !IsServiceProvider())
                {
                    return Unauthorized("Only service providers can view their rentals.");
                }

                var bookings = await _context.SeatRentalBookings
                    .Include(b => b.SeatRental)
                        .ThenInclude(sr => sr.Owner)
                    .Include(b => b.Renter)
                    .Include(b => b.ClientBookings)
                    .Where(b => b.RenterId == userId)
                    .OrderByDescending(b => b.CreatedAt)
                    .ToListAsync();

                var result = bookings.Select(MapToSeatRentalBookingDto).ToList();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user rentals for {UserId}", GetUserId());
                return StatusCode(500, "An error occurred while retrieving your rentals.");
            }
        }

        // POST: api/SeatRental
        [HttpPost]
        public async Task<ActionResult<SeatRentalDto>> CreateSeatRental([FromBody] CreateSeatRentalDto dto)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId) || !IsServiceProvider())
                {
                    return Unauthorized("Only service providers can create seat rentals.");
                }

                var seatRental = new SeatRental
                {
                    OwnerId = userId,
                    Title = dto.Title,
                    Description = dto.Description,
                    Address = dto.Address,
                    City = dto.City,
                    State = dto.State,
                    ZipCode = dto.ZipCode,
                    DailyRate = dto.DailyRate,
                    WeeklyRate = dto.WeeklyRate,
                    MonthlyRate = dto.MonthlyRate,
                    CommissionRate = dto.CommissionRate,
                    Amenities = JsonSerializer.Serialize(dto.Amenities),
                    AvailableHours = JsonSerializer.Serialize(dto.AvailableHours),
                    Photos = JsonSerializer.Serialize(new List<string>()),
                    RequiresApproval = dto.RequiresApproval,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.SeatRentals.Add(seatRental);
                await _context.SaveChangesAsync();

                var createdRental = await _context.SeatRentals
                    .Include(sr => sr.Owner)
                    .Include(sr => sr.Bookings)
                    .FirstAsync(sr => sr.Id == seatRental.Id);

                return CreatedAtAction(nameof(GetSeatRental), new { id = seatRental.Id }, MapToSeatRentalDto(createdRental));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating seat rental for user {UserId}", GetUserId());
                return StatusCode(500, "An error occurred while creating the seat rental.");
            }
        }

        // GET: api/SeatRental/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<SeatRentalDto>> GetSeatRental(int id)
        {
            try
            {
                var seatRental = await _context.SeatRentals
                    .Include(sr => sr.Owner)
                    .Include(sr => sr.Bookings)
                        .ThenInclude(b => b.Renter)
                    .FirstOrDefaultAsync(sr => sr.Id == id);

                if (seatRental == null)
                {
                    return NotFound("Seat rental not found.");
                }

                return Ok(MapToSeatRentalDto(seatRental));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting seat rental {SeatRentalId}", id);
                return StatusCode(500, "An error occurred while retrieving the seat rental.");
            }
        }

        // PUT: api/SeatRental/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<SeatRentalDto>> UpdateSeatRental(int id, [FromBody] UpdateSeatRentalDto dto)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId) || !IsServiceProvider())
                {
                    return Unauthorized("Only service providers can update seat rentals.");
                }

                var seatRental = await _context.SeatRentals
                    .Include(sr => sr.Owner)
                    .Include(sr => sr.Bookings)
                    .FirstOrDefaultAsync(sr => sr.Id == id && sr.OwnerId == userId);

                if (seatRental == null)
                {
                    return NotFound("Seat rental not found or you don't have permission to update it.");
                }

                // Update properties
                seatRental.Title = dto.Title;
                seatRental.Description = dto.Description;
                seatRental.Address = dto.Address;
                seatRental.City = dto.City;
                seatRental.State = dto.State;
                seatRental.ZipCode = dto.ZipCode;
                seatRental.DailyRate = dto.DailyRate;
                seatRental.WeeklyRate = dto.WeeklyRate;
                seatRental.MonthlyRate = dto.MonthlyRate;
                seatRental.CommissionRate = dto.CommissionRate;
                seatRental.Amenities = JsonSerializer.Serialize(dto.Amenities);
                seatRental.AvailableHours = JsonSerializer.Serialize(dto.AvailableHours);
                seatRental.RequiresApproval = dto.RequiresApproval;
                seatRental.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(MapToSeatRentalDto(seatRental));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating seat rental {SeatRentalId} for user {UserId}", id, GetUserId());
                return StatusCode(500, "An error occurred while updating the seat rental.");
            }
        }

        // DELETE: api/SeatRental/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteSeatRental(int id)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId) || !IsServiceProvider())
                {
                    return Unauthorized("Only service providers can delete seat rentals.");
                }

                var seatRental = await _context.SeatRentals
                    .Include(sr => sr.Bookings)
                    .FirstOrDefaultAsync(sr => sr.Id == id && sr.OwnerId == userId);

                if (seatRental == null)
                {
                    return NotFound("Seat rental not found or you don't have permission to delete it.");
                }

                // Check for active bookings
                var activeBookings = seatRental.Bookings.Any(b => b.Status == "active");
                if (activeBookings)
                {
                    return BadRequest("Cannot delete seat rental with active bookings.");
                }

                seatRental.IsActive = false;
                seatRental.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok("Seat rental deactivated successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting seat rental {SeatRentalId} for user {UserId}", id, GetUserId());
                return StatusCode(500, "An error occurred while deleting the seat rental.");
            }
        }

        // POST: api/SeatRental/{id}/book
        [HttpPost("{id}/book")]
        public async Task<ActionResult<SeatRentalBookingDto>> BookSeatRental(int id, [FromBody] CreateSeatRentalBookingDto dto)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId) || !IsServiceProvider())
                {
                    return Unauthorized("Only service providers can book seat rentals.");
                }

                var seatRental = await _context.SeatRentals
                    .Include(sr => sr.Owner)
                    .Include(sr => sr.Bookings)
                    .FirstOrDefaultAsync(sr => sr.Id == id && sr.IsActive);

                if (seatRental == null)
                {
                    return NotFound("Seat rental not found or not available.");
                }

                if (seatRental.OwnerId == userId)
                {
                    return BadRequest("You cannot book your own seat rental.");
                }

                // Check for conflicts
                var hasConflict = seatRental.Bookings.Any(b => 
                    (b.Status == "pending" || b.Status == "approved" || b.Status == "active") &&
                    ((b.StartDate <= dto.StartDate && b.EndDate >= dto.StartDate) ||
                     (b.StartDate <= dto.EndDate && b.EndDate >= dto.EndDate) ||
                     (b.StartDate >= dto.StartDate && b.EndDate <= dto.EndDate)));

                if (hasConflict)
                {
                    return Conflict("The selected dates conflict with an existing booking.");
                }

                // Calculate total amount
                var days = (dto.EndDate - dto.StartDate).Days;
                var totalAmount = days * seatRental.DailyRate;
                var commissionAmount = totalAmount * seatRental.CommissionRate;

                var booking = new SeatRentalBooking
                {
                    SeatRentalId = id,
                    RenterId = userId,
                    StartDate = dto.StartDate,
                    EndDate = dto.EndDate,
                    TotalAmount = totalAmount,
                    CommissionAmount = commissionAmount,
                    Status = seatRental.RequiresApproval ? "pending" : "approved",
                    Notes = dto.Notes,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.SeatRentalBookings.Add(booking);
                await _context.SaveChangesAsync();

                var createdBooking = await _context.SeatRentalBookings
                    .Include(b => b.SeatRental)
                        .ThenInclude(sr => sr.Owner)
                    .Include(b => b.Renter)
                    .Include(b => b.ClientBookings)
                    .FirstAsync(b => b.Id == booking.Id);

                return CreatedAtAction(nameof(GetBookingDetails), new { id = booking.Id }, MapToSeatRentalBookingDto(createdBooking));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error booking seat rental {SeatRentalId} for user {UserId}", id, GetUserId());
                return StatusCode(500, "An error occurred while booking the seat rental.");
            }
        }

        // GET: api/SeatRental/bookings/{id}
        [HttpGet("bookings/{id}")]
        public async Task<ActionResult<SeatRentalBookingDto>> GetBookingDetails(int id)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId) || !IsServiceProvider())
                {
                    return Unauthorized("Only service providers can view booking details.");
                }

                var booking = await _context.SeatRentalBookings
                    .Include(b => b.SeatRental)
                        .ThenInclude(sr => sr.Owner)
                    .Include(b => b.Renter)
                    .Include(b => b.ClientBookings)
                    .FirstOrDefaultAsync(b => b.Id == id && (b.RenterId == userId || b.SeatRental.OwnerId == userId));

                if (booking == null)
                {
                    return NotFound("Booking not found or you don't have permission to view it.");
                }

                return Ok(MapToSeatRentalBookingDto(booking));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting booking details {BookingId} for user {UserId}", id, GetUserId());
                return StatusCode(500, "An error occurred while retrieving booking details.");
            }
        }

        // PUT: api/SeatRental/bookings/{id}/status
        [HttpPut("bookings/{id}/status")]
        public async Task<ActionResult> UpdateBookingStatus(int id, [FromBody] UpdateBookingStatusDto dto)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId) || !IsServiceProvider())
                {
                    return Unauthorized("Only service providers can update booking status.");
                }

                var booking = await _context.SeatRentalBookings
                    .Include(b => b.SeatRental)
                    .FirstOrDefaultAsync(b => b.Id == id && b.SeatRental.OwnerId == userId);

                if (booking == null)
                {
                    return NotFound("Booking not found or you don't have permission to update it.");
                }

                if (booking.Status != "pending")
                {
                    return BadRequest("Only pending bookings can be approved or rejected.");
                }

                booking.Status = dto.Status;
                booking.Notes = dto.Notes;
                booking.UpdatedAt = DateTime.UtcNow;

                if (dto.Status == "approved")
                {
                    booking.Status = "active";
                }

                await _context.SaveChangesAsync();

                return Ok($"Booking {dto.Status} successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating booking status {BookingId} for user {UserId}", id, GetUserId());
                return StatusCode(500, "An error occurred while updating booking status.");
            }
        }

        // GET: api/SeatRental/stats
        [HttpGet("stats")]
        public async Task<ActionResult<SeatRentalStatsDto>> GetStats()
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId) || !IsServiceProvider())
                {
                    return Unauthorized("Only service providers can view stats.");
                }

                var totalListings = await _context.SeatRentals
                    .CountAsync(sr => sr.OwnerId == userId && sr.IsActive);

                var activeBookings = await _context.SeatRentalBookings
                    .Include(b => b.SeatRental)
                    .CountAsync(b => b.SeatRental.OwnerId == userId && b.Status == "active");

                var pendingRequests = await _context.SeatRentalBookings
                    .Include(b => b.SeatRental)
                    .CountAsync(b => b.SeatRental.OwnerId == userId && b.Status == "pending");

                var monthlyRevenue = await _context.SeatRentalBookings
                    .Include(b => b.SeatRental)
                    .Where(b => b.SeatRental.OwnerId == userId && 
                               b.Status == "active" && 
                               b.StartDate <= DateTime.UtcNow &&
                               b.EndDate >= DateTime.UtcNow.AddDays(-30))
                    .SumAsync(b => b.TotalAmount - b.CommissionAmount);

                var commissionEarned = await _context.SeatRentalBookings
                    .Where(b => b.RenterId == userId && 
                               b.Status == "active" &&
                               b.StartDate <= DateTime.UtcNow &&
                               b.EndDate >= DateTime.UtcNow.AddDays(-30))
                    .SumAsync(b => b.CommissionAmount);

                var recentActivity = await _context.SeatRentalBookings
                    .Include(b => b.SeatRental)
                    .Include(b => b.Renter)
                    .Where(b => b.SeatRental.OwnerId == userId)
                    .OrderByDescending(b => b.CreatedAt)
                    .Take(10)
                    .Select(b => new BookingStatsDto
                    {
                        RenterName = b.Renter.FirstName + " " + b.Renter.LastName,
                        SeatTitle = b.SeatRental.Title,
                        Date = b.CreatedAt,
                        Status = b.Status,
                        Amount = b.TotalAmount
                    })
                    .ToListAsync();

                var stats = new SeatRentalStatsDto
                {
                    TotalListings = totalListings,
                    ActiveBookings = activeBookings,
                    PendingRequests = pendingRequests,
                    MonthlyRevenue = monthlyRevenue,
                    CommissionEarned = commissionEarned,
                    RecentActivity = recentActivity
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting seat rental stats for user {UserId}", GetUserId());
                return StatusCode(500, "An error occurred while retrieving stats.");
            }
        }

        private SeatRentalDto MapToSeatRentalDto(SeatRental seatRental)
        {
            var amenities = new List<string>();
            var schedule = new ScheduleDto();
            var photos = new List<string>();

            try
            {
                if (!string.IsNullOrEmpty(seatRental.Amenities))
                    amenities = JsonSerializer.Deserialize<List<string>>(seatRental.Amenities) ?? new List<string>();

                if (!string.IsNullOrEmpty(seatRental.AvailableHours))
                    schedule = JsonSerializer.Deserialize<ScheduleDto>(seatRental.AvailableHours) ?? new ScheduleDto();

                if (!string.IsNullOrEmpty(seatRental.Photos))
                    photos = JsonSerializer.Deserialize<List<string>>(seatRental.Photos) ?? new List<string>();
            }
            catch (JsonException)
            {
                // Handle JSON parsing errors gracefully
            }

            return new SeatRentalDto
            {
                Id = seatRental.Id,
                OwnerId = seatRental.OwnerId,
                OwnerName = $"{seatRental.Owner.FirstName} {seatRental.Owner.LastName}",
                Title = seatRental.Title,
                Description = seatRental.Description,
                Address = seatRental.Address,
                City = seatRental.City,
                State = seatRental.State,
                ZipCode = seatRental.ZipCode,
                DailyRate = seatRental.DailyRate,
                WeeklyRate = seatRental.WeeklyRate,
                MonthlyRate = seatRental.MonthlyRate,
                CommissionRate = seatRental.CommissionRate,
                Amenities = amenities,
                AvailableHours = schedule,
                Photos = photos,
                IsActive = seatRental.IsActive,
                RequiresApproval = seatRental.RequiresApproval,
                CreatedAt = seatRental.CreatedAt,
                ActiveBookings = seatRental.Bookings
                    .Where(b => b.Status == "active")
                    .Select(MapToSeatRentalBookingDto)
                    .ToList()
            };
        }

        private SeatRentalBookingDto MapToSeatRentalBookingDto(SeatRentalBooking booking)
        {
            return new SeatRentalBookingDto
            {
                Id = booking.Id,
                SeatRentalId = booking.SeatRentalId,
                RenterId = booking.RenterId,
                RenterName = $"{booking.Renter.FirstName} {booking.Renter.LastName}",
                RenterEmail = booking.Renter.Email ?? string.Empty,
                StartDate = booking.StartDate,
                EndDate = booking.EndDate,
                TotalAmount = booking.TotalAmount,
                CommissionAmount = booking.CommissionAmount,
                Status = booking.Status,
                Notes = booking.Notes,
                CreatedAt = booking.CreatedAt,
                SeatRental = booking.SeatRental != null ? MapToSeatRentalDto(booking.SeatRental) : null,
                ClientBookingsCount = booking.ClientBookings?.Count ?? 0
            };
        }
    }
}
