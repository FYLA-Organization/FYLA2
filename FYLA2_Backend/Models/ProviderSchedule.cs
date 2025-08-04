using System.ComponentModel.DataAnnotations;

namespace FYLA2_Backend.Models
{
  public enum DayOfWeekEnum
  {
    Sunday = 0,
    Monday = 1,
    Tuesday = 2,
    Wednesday = 3,
    Thursday = 4,
    Friday = 5,
    Saturday = 6
  }

  public class ProviderSchedule
  {
    public int Id { get; set; }

    [Required]
    public string ProviderId { get; set; } = string.Empty;

    [Required]
    public DayOfWeekEnum DayOfWeek { get; set; }

    [Required]
    public bool IsAvailable { get; set; } = false;

    public TimeSpan? StartTime { get; set; }

    public TimeSpan? EndTime { get; set; }

    // Break times (optional)
    public TimeSpan? BreakStartTime { get; set; }
    public TimeSpan? BreakEndTime { get; set; }

    // For special dates or temporary schedule changes
    public DateTime? SpecificDate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User Provider { get; set; } = null!;
  }

  public class ProviderBlockedTime
  {
    public int Id { get; set; }

    [Required]
    public string ProviderId { get; set; } = string.Empty;

    [Required]
    public DateTime Date { get; set; }

    [Required]
    public TimeSpan StartTime { get; set; }

    [Required]
    public TimeSpan EndTime { get; set; }

    [MaxLength(200)]
    public string? Reason { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User Provider { get; set; } = null!;
  }
}
