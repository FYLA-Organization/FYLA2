using System.ComponentModel.DataAnnotations;

namespace FYLA2_Backend.Models
{
    public class FileUpload
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(255)]
        public string FileName { get; set; } = "";

        [Required]
        [MaxLength(255)]
        public string FilePath { get; set; } = "";

        [Required]
        [MaxLength(100)]
        public string ContentType { get; set; } = "";

        public long FileSize { get; set; }

        [MaxLength(50)]
        public string Category { get; set; } = "general";

        public string? Description { get; set; }

        public string? ThumbnailPath { get; set; }

        [Required]
        public string UserId { get; set; } = "";

        public bool IsOptimized { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? DeletedAt { get; set; }

        // Navigation properties
        public virtual User User { get; set; } = null!;
    }
}
