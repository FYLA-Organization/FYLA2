using System.ComponentModel.DataAnnotations;

namespace FYLA2_Backend.Models
{
    public enum CancellationTimeFrame
    {
        SameDay,        // 0-24 hours before
        OneDayBefore,   // 24-48 hours before
        TwoDaysBefore,  // 48-72 hours before
        ThreeDaysBefore,// 72-96 hours before
        OneWeekBefore,  // 7+ days before
        TwoWeeksBefore, // 14+ days before
        OneMonthBefore  // 30+ days before
    }

    public class CancellationPolicy
    {
        public int Id { get; set; }

        [Required]
        public string ProviderId { get; set; } = string.Empty;

        // Cancellation Rules
        [Range(0, 100)]
        public decimal SameDayFeePercentage { get; set; } = 100m; // 100% fee for same day

        [Range(0, 100)]
        public decimal OneDayBeforeFeePercentage { get; set; } = 50m; // 50% fee

        [Range(0, 100)]
        public decimal TwoDaysBeforeFeePercentage { get; set; } = 25m; // 25% fee

        [Range(0, 100)]
        public decimal ThreeDaysBeforeFeePercentage { get; set; } = 10m; // 10% fee

        [Range(0, 100)]
        public decimal OneWeekBeforeFeePercentage { get; set; } = 0m; // Free cancellation

        // Reschedule Rules
        public int FreeReschedulesAllowed { get; set; } = 2;
        
        [Range(0, 100)]
        public decimal RescheduleFeePercentage { get; set; } = 10m; // After free reschedules

        public int MinimumRescheduleHours { get; set; } = 24; // Minimum notice for reschedule

        // Flexibility Settings
        public bool AllowSameDayCancellation { get; set; } = true;
        public bool AllowSameDayReschedule { get; set; } = false;
        public bool RefundProcessingFee { get; set; } = false; // Whether to refund processing fees

        // Custom Policy Text
        [MaxLength(1000)]
        public string? PolicyDescription { get; set; }

        [MaxLength(500)]
        public string? SpecialCircumstances { get; set; } // e.g., "Emergency situations waived"

        // Metadata
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public virtual User? Provider { get; set; }
    }

    public class BookingAction
    {
        public int Id { get; set; }

        [Required]
        public int BookingId { get; set; }

        [Required]
        public string ActionType { get; set; } = string.Empty; // "cancel", "reschedule", "modify"

        [Required]
        public string RequestedBy { get; set; } = string.Empty; // UserId who requested

        public DateTime? NewBookingDate { get; set; } // For reschedules
        public DateTime? NewStartTime { get; set; }
        public DateTime? NewEndTime { get; set; }

        [MaxLength(500)]
        public string? Reason { get; set; }

        public decimal FeeAmount { get; set; } = 0m;
        public decimal RefundAmount { get; set; } = 0m;

        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected

        [MaxLength(1000)]
        public string? ProviderNotes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ProcessedAt { get; set; }

        // Navigation
        public virtual Booking? Booking { get; set; }
        public virtual User? RequestedByUser { get; set; }
    }
}
