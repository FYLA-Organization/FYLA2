using FYLA2_Backend.DTOs.Loyalty;

namespace FYLA2_Backend.DTOs.Booking
{
  public class BookingCreationResponseDto
  {
    public BookingDto Booking { get; set; } = null!;
    public LoyaltyPointsEarnedDto? LoyaltyPoints { get; set; }
  }
}
