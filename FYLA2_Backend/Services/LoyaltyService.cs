using Microsoft.EntityFrameworkCore;
using FYLA2_Backend.Data;
using FYLA2_Backend.Models;
using FYLA2_Backend.DTOs.Loyalty;

namespace FYLA2_Backend.Services
{
  public interface ILoyaltyService
  {
    Task<LoyaltyPointsEarnedDto> AwardPointsForBookingAsync(int bookingId);
    Task<ClientLoyaltyStatusDto> GetClientLoyaltyStatusAsync(string clientId, string? providerId = null);
    Task<bool> RedeemPointsAsync(string clientId, string providerId, int points, string description);
    int CalculatePointsForAmount(decimal amount);
  }

  public class LoyaltyService : ILoyaltyService
  {
    private readonly ApplicationDbContext _context;
    private const int POINTS_PER_DOLLAR = 10; // 10 points per $1 spent
    private const decimal POINTS_VALUE = 0.01m; // Each point worth $0.01

    public LoyaltyService(ApplicationDbContext context)
    {
      _context = context;
    }

    public async Task<LoyaltyPointsEarnedDto> AwardPointsForBookingAsync(int bookingId)
    {
      var booking = await _context.Bookings
          .Include(b => b.Client)
          .Include(b => b.Provider)
          .Include(b => b.Service)
          .FirstOrDefaultAsync(b => b.Id == bookingId);

      if (booking == null)
        throw new ArgumentException("Booking not found");

      // Check if points already awarded
      var existingTransaction = await _context.LoyaltyTransactions
          .FirstOrDefaultAsync(lt => lt.BookingId == bookingId &&
                                   lt.TransactionType == LoyaltyTransactionType.Earned);

      if (existingTransaction != null)
      {
        // Return existing points info
        return new LoyaltyPointsEarnedDto
        {
          PointsEarned = existingTransaction.Points,
          TotalPoints = booking.Client.LoyaltyPoints,
          ProviderName = booking.Provider.FirstName + " " + booking.Provider.LastName,
          ServiceName = booking.Service.Name,
          AmountSpent = booking.TotalPrice,
          Description = existingTransaction.Description ?? ""
        };
      }

      // Calculate points to award
      var pointsToAward = CalculatePointsForAmount(booking.TotalPrice);

      // Create loyalty transaction
      var loyaltyTransaction = new LoyaltyTransaction
      {
        UserId = booking.ClientId,
        ProviderId = booking.ProviderId,
        BookingId = booking.Id,
        Points = pointsToAward,
        TransactionType = LoyaltyTransactionType.Earned,
        Description = $"Points earned for {booking.Service.Name} booking",
        CreatedAt = DateTime.UtcNow,
        ExpiresAt = DateTime.UtcNow.AddYears(1) // Points expire in 1 year
      };

      _context.LoyaltyTransactions.Add(loyaltyTransaction);

      // Update user's total points
      booking.Client.LoyaltyPoints += pointsToAward;

      await _context.SaveChangesAsync();

      return new LoyaltyPointsEarnedDto
      {
        PointsEarned = pointsToAward,
        TotalPoints = booking.Client.LoyaltyPoints,
        ProviderName = booking.Provider.FirstName + " " + booking.Provider.LastName,
        ServiceName = booking.Service.Name,
        AmountSpent = booking.TotalPrice,
        Description = loyaltyTransaction.Description
      };
    }

    public async Task<ClientLoyaltyStatusDto> GetClientLoyaltyStatusAsync(string clientId, string? providerId = null)
    {
      var client = await _context.Users.FindAsync(clientId);
      if (client == null)
        throw new ArgumentException("Client not found");

      // Get all transactions for this client
      var transactionsQuery = _context.LoyaltyTransactions
          .Where(lt => lt.UserId == clientId);

      if (!string.IsNullOrEmpty(providerId))
      {
        transactionsQuery = transactionsQuery.Where(lt => lt.ProviderId == providerId);
      }

      var transactions = await transactionsQuery
          .OrderByDescending(lt => lt.CreatedAt)
          .Take(10)
          .Select(lt => new LoyaltyTransactionDto
          {
            Id = lt.Id,
            UserId = lt.UserId,
            ProviderId = lt.ProviderId,
            BookingId = lt.BookingId,
            Points = lt.Points,
            TransactionType = lt.TransactionType.ToString(),
            Description = lt.Description,
            CreatedAt = lt.CreatedAt,
            ExpiresAt = lt.ExpiresAt
          })
          .ToListAsync();

      // Calculate points with specific provider if specified
      var pointsWithProvider = 0;
      if (!string.IsNullOrEmpty(providerId))
      {
        var loyaltyTransactions = await _context.LoyaltyTransactions
            .Where(lt => lt.UserId == clientId && lt.ProviderId == providerId &&
                        (lt.ExpiresAt == null || lt.ExpiresAt > DateTime.UtcNow))
            .ToListAsync();
        
        pointsWithProvider = loyaltyTransactions
            .Sum(lt => lt.TransactionType == LoyaltyTransactionType.Earned ? lt.Points : -lt.Points);
      }

      // Get booking stats
      var bookings = await _context.Bookings
          .Where(b => b.ClientId == clientId &&
                     (providerId == null || b.ProviderId == providerId))
          .ToListAsync();

      var bookingStats = bookings.Count > 0 ? new
      {
        TotalBookings = bookings.Count,
        TotalSpent = bookings.Sum(b => b.TotalPrice)
      } : null;

      // Determine membership tier based on total spent
      var membershipTier = DetermineMembershipTier(bookingStats?.TotalSpent ?? 0);

      return new ClientLoyaltyStatusDto
      {
        TotalPoints = client.LoyaltyPoints,
        PointsWithProvider = pointsWithProvider,
        TotalBookings = bookingStats?.TotalBookings ?? 0,
        TotalSpent = bookingStats?.TotalSpent ?? 0,
        MembershipTier = membershipTier,
        RecentTransactions = transactions
      };
    }

    public async Task<bool> RedeemPointsAsync(string clientId, string providerId, int points, string description)
    {
      var client = await _context.Users.FindAsync(clientId);
      if (client == null || client.LoyaltyPoints < points)
        return false;

      var loyaltyTransaction = new LoyaltyTransaction
      {
        UserId = clientId,
        ProviderId = providerId,
        Points = points,
        TransactionType = LoyaltyTransactionType.Redeemed,
        Description = description,
        CreatedAt = DateTime.UtcNow
      };

      _context.LoyaltyTransactions.Add(loyaltyTransaction);
      client.LoyaltyPoints -= points;

      await _context.SaveChangesAsync();
      return true;
    }

    public int CalculatePointsForAmount(decimal amount)
    {
      return (int)Math.Floor(amount * POINTS_PER_DOLLAR);
    }

    private string DetermineMembershipTier(decimal totalSpent)
    {
      return totalSpent switch
      {
        >= 1000 => "Platinum",
        >= 500 => "Gold",
        >= 200 => "Silver",
        _ => "Bronze"
      };
    }
  }
}
