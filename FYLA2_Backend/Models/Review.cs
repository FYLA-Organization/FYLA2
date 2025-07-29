using System.ComponentModel.DataAnnotations;

namespace FYLA2_Backend.Models
{
  public class Review
  {
    public string Id { get; set; } = string.Empty;

    [Required]
    [Range(1, 5)]
    public int Rating { get; set; }

    [MaxLength(1000)]
    public string? Comment { get; set; }

    // Questionnaire data stored as JSON
    public string? QuestionnaireData { get; set; }

    // Foreign Keys
    [Required]
    public string ReviewerId { get; set; } = string.Empty;

    [Required]
    public string RevieweeId { get; set; } = string.Empty;

    public string? ServiceId { get; set; }

    public int? BookingId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User Reviewer { get; set; } = null!;
    public virtual User Reviewee { get; set; } = null!;
    public virtual Service? Service { get; set; }
    public virtual Booking? Booking { get; set; }
  }
}
