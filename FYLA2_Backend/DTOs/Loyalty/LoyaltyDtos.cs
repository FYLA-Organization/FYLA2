namespace FYLA2_Backend.DTOs.Loyalty
{
  public class LoyaltyTransactionDto
  {
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string ProviderId { get; set; } = string.Empty;
    public int? BookingId { get; set; }
    public int Points { get; set; }
    public string TransactionType { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
  }

  public class LoyaltyPointsEarnedDto
  {
    public int PointsEarned { get; set; }
    public int TotalPoints { get; set; }
    public string ProviderName { get; set; } = string.Empty;
    public string ServiceName { get; set; } = string.Empty;
    public decimal AmountSpent { get; set; }
    public string Description { get; set; } = string.Empty;
  }

  public class ClientLoyaltyStatusDto
  {
    public int TotalPoints { get; set; }
    public int PointsWithProvider { get; set; }
    public int TotalBookings { get; set; }
    public decimal TotalSpent { get; set; }
    public string MembershipTier { get; set; } = "Bronze";
    public List<LoyaltyTransactionDto> RecentTransactions { get; set; } = new();
  }
}
