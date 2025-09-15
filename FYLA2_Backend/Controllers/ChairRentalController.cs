using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using FYLA2_Backend.Data;
using FYLA2_Backend.Models;
using FYLA2_Backend.DTOs.ChairRental;
using System.Text.Json;

namespace FYLA2_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChairRentalController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ChairRentalController> _logger;

        public ChairRentalController(ApplicationDbContext context, ILogger<ChairRentalController> logger)
        {
            _context = context;
            _logger = logger;
        }

        private string GetUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new UnauthorizedAccessException();
        }

        [HttpGet("my-chairs")]
        public async Task<ActionResult<List<ChairRentalDto>>> GetMyChairs()
        {
            var userId = GetUserId();
            
            var chairs = await _context.ChairRentals
                .Include(c => c.Location)
                .Include(c => c.Renter)
                .Where(c => c.OwnerId == userId)
                .Select(c => new ChairRentalDto
                {
                    Id = c.Id,
                    OwnerId = c.OwnerId,
                    LocationId = c.LocationId,
                    LocationName = c.Location.Name,
                    ChairNumber = c.ChairNumber,
                    MonthlyRent = c.MonthlyRent,
                    DepositAmount = c.DepositAmount,
                    RenterId = c.RenterId,
                    RenterName = c.Renter != null ? $"{c.Renter.FirstName} {c.Renter.LastName}" : null,
                    Status = c.Status.ToString(),
                    RentalStartDate = c.RentalStartDate,
                    RentalEndDate = c.RentalEndDate,
                    Description = c.Description,
                    Amenities = string.IsNullOrEmpty(c.Amenities) ? new List<string>() : JsonSerializer.Deserialize<List<string>>(c.Amenities, (JsonSerializerOptions?)null) ?? new List<string>(),
                    CreatedAt = c.CreatedAt
                })
                .ToListAsync();

            return Ok(chairs);
        }

        [HttpGet("available")]
        public async Task<ActionResult<List<ChairRentalDto>>> GetAvailableChairs()
        {
            var chairs = await _context.ChairRentals
                .Include(c => c.Location)
                .Include(c => c.Owner)
                .Where(c => c.Status == ChairRentalStatus.Available)
                .Select(c => new ChairRentalDto
                {
                    Id = c.Id,
                    OwnerId = c.OwnerId,
                    OwnerName = $"{c.Owner.FirstName} {c.Owner.LastName}",
                    LocationId = c.LocationId,
                    LocationName = c.Location.Name,
                    ChairNumber = c.ChairNumber,
                    MonthlyRent = c.MonthlyRent,
                    DepositAmount = c.DepositAmount,
                    Status = c.Status.ToString(),
                    Description = c.Description,
                    Amenities = string.IsNullOrEmpty(c.Amenities) ? new List<string>() : JsonSerializer.Deserialize<List<string>>(c.Amenities, (JsonSerializerOptions?)null) ?? new List<string>(),
                    CreatedAt = c.CreatedAt
                })
                .ToListAsync();

            return Ok(chairs);
        }

        [HttpPost("create")]
        public async Task<ActionResult<ChairRentalDto>> CreateChair([FromBody] CreateChairRentalDto request)
        {
            var userId = GetUserId();

            // Check if user has Business plan
            var subscription = await _context.Subscriptions
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.CreatedAt)
                .FirstOrDefaultAsync();

            if (subscription?.Tier != SubscriptionTier.Business)
            {
                return BadRequest("Chair rental management requires a Business plan subscription.");
            }

            // Verify location belongs to user
            var location = await _context.BusinessLocations
                .FirstOrDefaultAsync(l => l.Id.ToString() == request.LocationId && l.UserId == userId);

            if (location == null)
            {
                return BadRequest("Invalid location or location does not belong to you.");
            }

            var chair = new ChairRental
            {
                OwnerId = userId,
                LocationId = request.LocationId,
                ChairNumber = request.ChairNumber,
                MonthlyRent = request.MonthlyRent,
                DepositAmount = request.DepositAmount,
                Description = request.Description,
                Amenities = JsonSerializer.Serialize(request.Amenities),
                Status = ChairRentalStatus.Available,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.ChairRentals.Add(chair);
            await _context.SaveChangesAsync();

            var chairDto = new ChairRentalDto
            {
                Id = chair.Id,
                OwnerId = chair.OwnerId,
                LocationId = chair.LocationId,
                LocationName = location.Name,
                ChairNumber = chair.ChairNumber,
                MonthlyRent = chair.MonthlyRent,
                DepositAmount = chair.DepositAmount,
                Status = chair.Status.ToString(),
                Description = chair.Description,
                Amenities = request.Amenities,
                CreatedAt = chair.CreatedAt
            };

            return CreatedAtAction(nameof(GetMyChairs), chairDto);
        }

        [HttpPost("rent/{chairId}")]
        public async Task<ActionResult> RentChair(int chairId, [FromBody] RentChairDto request)
        {
            var userId = GetUserId();

            var chair = await _context.ChairRentals
                .Include(c => c.Owner)
                .FirstOrDefaultAsync(c => c.Id == chairId);

            if (chair == null)
            {
                return NotFound("Chair not found.");
            }

            if (chair.Status != ChairRentalStatus.Available)
            {
                return BadRequest("Chair is not available for rent.");
            }

            // Update chair rental
            chair.RenterId = userId;
            chair.Status = ChairRentalStatus.Rented;
            chair.RentalStartDate = request.RentalStartDate;
            chair.RentalEndDate = request.RentalEndDate;
            chair.UpdatedAt = DateTime.UtcNow;

            // Create initial deposit payment
            var depositPayment = new ChairRentalPayment
            {
                ChairRentalId = chairId,
                Amount = chair.DepositAmount,
                PaymentType = ChairRentalPaymentType.Deposit,
                DueDate = request.RentalStartDate,
                Status = ChairRentalPaymentStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            // Create first month's rent payment
            var firstRentPayment = new ChairRentalPayment
            {
                ChairRentalId = chairId,
                Amount = chair.MonthlyRent,
                PaymentType = ChairRentalPaymentType.MonthlyRent,
                DueDate = request.RentalStartDate,
                Status = ChairRentalPaymentStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            _context.ChairRentalPayments.AddRange(depositPayment, firstRentPayment);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Chair rented successfully. Please complete the payment process." });
        }

        [HttpGet("analytics")]
        public async Task<ActionResult<ChairRentalAnalyticsDto>> GetAnalytics()
        {
            var userId = GetUserId();

            var chairs = await _context.ChairRentals
                .Include(c => c.Location)
                .Include(c => c.Renter)
                .Include(c => c.Payments)
                .Where(c => c.OwnerId == userId)
                .ToListAsync();

            var totalChairs = chairs.Count;
            var rentedChairs = chairs.Count(c => c.Status == ChairRentalStatus.Rented);
            var availableChairs = chairs.Count(c => c.Status == ChairRentalStatus.Available);

            var currentMonth = DateTime.UtcNow.Month;
            var currentYear = DateTime.UtcNow.Year;

            var monthlyRevenue = chairs
                .SelectMany(c => c.Payments)
                .Where(p => p.PaidDate.HasValue && 
                           p.PaidDate.Value.Month == currentMonth && 
                           p.PaidDate.Value.Year == currentYear &&
                           p.Status == ChairRentalPaymentStatus.Paid)
                .Sum(p => p.Amount);

            var yearlyRevenue = chairs
                .SelectMany(c => c.Payments)
                .Where(p => p.PaidDate.HasValue && 
                           p.PaidDate.Value.Year == currentYear &&
                           p.Status == ChairRentalPaymentStatus.Paid)
                .Sum(p => p.Amount);

            var averageRent = chairs.Any() ? chairs.Average(c => c.MonthlyRent) : 0;
            var occupancyRate = totalChairs > 0 ? (double)rentedChairs / totalChairs * 100 : 0;

            var recentRentals = chairs
                .Where(c => c.Status == ChairRentalStatus.Rented)
                .OrderByDescending(c => c.RentalStartDate)
                .Take(5)
                .Select(c => new ChairRentalDto
                {
                    Id = c.Id,
                    LocationName = c.Location.Name,
                    ChairNumber = c.ChairNumber,
                    MonthlyRent = c.MonthlyRent,
                    RenterName = c.Renter != null ? $"{c.Renter.FirstName} {c.Renter.LastName}" : "Unknown",
                    RentalStartDate = c.RentalStartDate,
                    RentalEndDate = c.RentalEndDate
                })
                .ToList();

            var pendingPayments = await _context.ChairRentalPayments
                .Include(p => p.ChairRental)
                .Where(p => chairs.Select(c => c.Id).Contains(p.ChairRentalId) && 
                           p.Status == ChairRentalPaymentStatus.Pending)
                .Select(p => new ChairRentalPaymentDto
                {
                    Id = p.Id,
                    ChairRentalId = p.ChairRentalId,
                    Amount = p.Amount,
                    PaymentType = p.PaymentType.ToString(),
                    DueDate = p.DueDate,
                    Status = p.Status.ToString()
                })
                .ToListAsync();

            var analytics = new ChairRentalAnalyticsDto
            {
                TotalChairs = totalChairs,
                RentedChairs = rentedChairs,
                AvailableChairs = availableChairs,
                MonthlyRevenue = monthlyRevenue,
                YearlyRevenue = yearlyRevenue,
                AverageRent = averageRent,
                OccupancyRate = occupancyRate,
                RecentRentals = recentRentals,
                PendingPayments = pendingPayments
            };

            return Ok(analytics);
        }

        [HttpPost("payments/{paymentId}/mark-paid")]
        public async Task<ActionResult> MarkPaymentAsPaid(int paymentId)
        {
            var userId = GetUserId();

            var payment = await _context.ChairRentalPayments
                .Include(p => p.ChairRental)
                .FirstOrDefaultAsync(p => p.Id == paymentId && p.ChairRental.OwnerId == userId);

            if (payment == null)
            {
                return NotFound("Payment not found.");
            }

            payment.Status = ChairRentalPaymentStatus.Paid;
            payment.PaidDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Payment marked as paid successfully." });
        }
    }
}
