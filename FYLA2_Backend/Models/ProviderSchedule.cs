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

  public enum BreakType
  {
    Lunch = 0,
    Personal = 1,
    Meeting = 2,
    Other = 3
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

    // For special dates or temporary schedule changes
    public DateTime? SpecificDate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User Provider { get; set; } = null!;
    public virtual ICollection<ProviderBreak> Breaks { get; set; } = new List<ProviderBreak>();
  }

  public class ProviderBreak
  {
    public int Id { get; set; }

    [Required]
    public int ScheduleId { get; set; }

    [Required]
    public TimeSpan StartTime { get; set; }

    [Required]
    public TimeSpan EndTime { get; set; }

    [Required]
    [MaxLength(100)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public BreakType Type { get; set; } = BreakType.Lunch;

    [MaxLength(7)] // Hex color code
    public string Color { get; set; } = "#FF6B35";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ProviderSchedule Schedule { get; set; } = null!;
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

  // DTOs for API responses
  public class ProviderScheduleDto
  {
    public int Id { get; set; }
    public DayOfWeekEnum DayOfWeek { get; set; }
    public bool IsAvailable { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public DateTime? SpecificDate { get; set; }
    public List<ProviderBreakDto> Breaks { get; set; } = new List<ProviderBreakDto>();
  }

  public class ProviderBreakDto
  {
    public int Id { get; set; }
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public BreakType Type { get; set; }
    public string Color { get; set; } = string.Empty;
  }

  public class CreateScheduleRequest
  {
    public DayOfWeekEnum DayOfWeek { get; set; }
    public bool IsAvailable { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public DateTime? SpecificDate { get; set; }
    public List<CreateBreakRequest> Breaks { get; set; } = new List<CreateBreakRequest>();
  }

  public class CreateBreakRequest
  {
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public BreakType Type { get; set; } = BreakType.Lunch;
    public string Color { get; set; } = "#FF6B35";
  }
}
