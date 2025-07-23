using System.ComponentModel.DataAnnotations;

namespace FYLA2_Backend.Models
{
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
