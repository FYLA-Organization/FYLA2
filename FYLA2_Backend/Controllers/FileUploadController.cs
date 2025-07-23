using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FYLA2_Backend.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  [Authorize]
  public class FileUploadController : ControllerBase
  {
    private readonly ILogger<FileUploadController> _logger;
    private readonly IWebHostEnvironment _environment;
    private readonly long _maxFileSize = 10 * 1024 * 1024; // 10MB
    private readonly string[] _allowedImageExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
    private readonly string[] _allowedFileExtensions = { ".pdf", ".doc", ".docx", ".txt", ".xlsx", ".xls" };

    public FileUploadController(ILogger<FileUploadController> logger, IWebHostEnvironment environment)
    {
      _logger = logger;
      _environment = environment;
    }

    // POST: api/fileupload/image
    [HttpPost("image")]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10MB limit
    public async Task<ActionResult<FileUploadResponse>> UploadImage(IFormFile file)
    {
      var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (string.IsNullOrEmpty(userId))
        return Unauthorized();

      if (file == null || file.Length == 0)
        return BadRequest("No file uploaded");

      if (file.Length > _maxFileSize)
        return BadRequest("File too large. Maximum size is 10MB");

      var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
      if (!_allowedImageExtensions.Contains(extension))
        return BadRequest("Invalid file type. Only images are allowed");

      try
      {
        var fileName = GenerateUniqueFileName(userId, extension);
        var uploadPath = Path.Combine(_environment.WebRootPath, "uploads", "images");

        // Ensure directory exists
        Directory.CreateDirectory(uploadPath);

        var filePath = Path.Combine(uploadPath, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
          await file.CopyToAsync(stream);
        }

        var fileUrl = $"/uploads/images/{fileName}";

        _logger.LogInformation("Image uploaded successfully: {FileName} by user {UserId}", fileName, userId);

        return Ok(new FileUploadResponse
        {
          Url = fileUrl,
          FileName = file.FileName,
          Size = file.Length,
          Type = "image",
          MimeType = file.ContentType
        });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error uploading image for user {UserId}", userId);
        return StatusCode(500, "Error uploading file");
      }
    }

    // POST: api/fileupload/document
    [HttpPost("document")]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10MB limit
    public async Task<ActionResult<FileUploadResponse>> UploadDocument(IFormFile file)
    {
      var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (string.IsNullOrEmpty(userId))
        return Unauthorized();

      if (file == null || file.Length == 0)
        return BadRequest("No file uploaded");

      if (file.Length > _maxFileSize)
        return BadRequest("File too large. Maximum size is 10MB");

      var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
      if (!_allowedFileExtensions.Contains(extension))
        return BadRequest("Invalid file type");

      try
      {
        var fileName = GenerateUniqueFileName(userId, extension);
        var uploadPath = Path.Combine(_environment.WebRootPath, "uploads", "documents");

        // Ensure directory exists
        Directory.CreateDirectory(uploadPath);

        var filePath = Path.Combine(uploadPath, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
          await file.CopyToAsync(stream);
        }

        var fileUrl = $"/uploads/documents/{fileName}";

        _logger.LogInformation("Document uploaded successfully: {FileName} by user {UserId}", fileName, userId);

        return Ok(new FileUploadResponse
        {
          Url = fileUrl,
          FileName = file.FileName,
          Size = file.Length,
          Type = "document",
          MimeType = file.ContentType
        });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error uploading document for user {UserId}", userId);
        return StatusCode(500, "Error uploading file");
      }
    }

    // GET: api/fileupload/serve/{folder}/{fileName}
    [HttpGet("serve/{folder}/{fileName}")]
    [AllowAnonymous] // Allow public access to uploaded files
    public async Task<IActionResult> ServeFile(string folder, string fileName)
    {
      try
      {
        var allowedFolders = new[] { "images", "documents" };
        if (!allowedFolders.Contains(folder.ToLower()))
          return BadRequest("Invalid folder");

        var filePath = Path.Combine(_environment.WebRootPath, "uploads", folder, fileName);

        if (!System.IO.File.Exists(filePath))
          return NotFound();

        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        var mimeType = GetMimeType(extension);

        var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
        return File(fileBytes, mimeType);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error serving file {FileName} from {Folder}", fileName, folder);
        return StatusCode(500, "Error serving file");
      }
    }

    private string GenerateUniqueFileName(string userId, string extension)
    {
      var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
      var guid = Guid.NewGuid().ToString("N")[..8];
      return $"{userId}_{timestamp}_{guid}{extension}";
    }

    private string GetMimeType(string extension)
    {
      return extension switch
      {
        ".jpg" or ".jpeg" => "image/jpeg",
        ".png" => "image/png",
        ".gif" => "image/gif",
        ".webp" => "image/webp",
        ".pdf" => "application/pdf",
        ".doc" => "application/msword",
        ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".txt" => "text/plain",
        ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".xls" => "application/vnd.ms-excel",
        _ => "application/octet-stream"
      };
    }
  }

  // DTOs
  public class FileUploadResponse
  {
    public string Url { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long Size { get; set; }
    public string Type { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
  }
}
