using System.ComponentModel.DataAnnotations;

namespace FYLA2_Backend.Models
{
  public enum MessageStatus
  {
    Sent = 0,      // Message sent by sender
    Delivered = 1, // Message delivered to recipient's device
    Read = 2       // Message read by recipient
  }

  public class Message
  {
    public int Id { get; set; }

    [Required]
    [MaxLength(1000)]
    public string Content { get; set; } = string.Empty;

    public bool IsRead { get; set; } = false;

    [MaxLength(20)]
    public string MessageType { get; set; } = "text"; // text, image, file, booking

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // Message Status Tracking
    public MessageStatus Status { get; set; } = MessageStatus.Sent;
    public DateTime? DeliveredAt { get; set; }
    public DateTime? ReadAt { get; set; }

    // File/Image Support
    public string? AttachmentUrl { get; set; }
    public string? AttachmentType { get; set; } // image, file, audio, video
    public long? AttachmentSize { get; set; }
    public string? AttachmentName { get; set; }

    // Foreign Keys
    [Required]
    public string SenderId { get; set; } = string.Empty;

    [Required]
    public string ReceiverId { get; set; } = string.Empty;

    public int? BookingId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User Sender { get; set; } = null!;
    public virtual User Receiver { get; set; } = null!;
    public virtual Booking? Booking { get; set; }
  }
}
