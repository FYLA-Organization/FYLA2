using Microsoft.Extensions.Options;

namespace FYLA2_Backend.Services
{
    public class FileUploadOptions
    {
        public string UploadPath { get; set; } = "wwwroot/uploads";
        public string BaseUrl { get; set; } = "";
        public long MaxFileSize { get; set; } = 5 * 1024 * 1024; // 5MB
        public string[] AllowedExtensions { get; set; } = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
    }

    public interface IFileUploadService
    {
        Task<string> UploadImageAsync(IFormFile file, string folder = "general");
        Task<bool> DeleteImageAsync(string imageUrl);
        Task<string> UploadServiceImageAsync(IFormFile file, int serviceId);
        Task<string> UploadPortfolioImageAsync(IFormFile file, string providerId);
        bool IsValidImageFile(IFormFile file);
    }

    public class FileUploadService : IFileUploadService
    {
        private readonly FileUploadOptions _options;
        private readonly ILogger<FileUploadService> _logger;

        public FileUploadService(IOptions<FileUploadOptions> options, ILogger<FileUploadService> logger)
        {
            _options = options.Value;
            _logger = logger;
        }

        public async Task<string> UploadImageAsync(IFormFile file, string folder = "general")
        {
            if (!IsValidImageFile(file))
            {
                throw new ArgumentException("Invalid file type or size");
            }

            // Create upload directory if it doesn't exist
            var uploadPath = Path.Combine(_options.UploadPath, folder);
            Directory.CreateDirectory(uploadPath);

            // Generate unique filename
            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(uploadPath, fileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Return URL path
            var relativePath = Path.Combine(folder, fileName).Replace('\\', '/');
            return $"{_options.BaseUrl}/uploads/{relativePath}";
        }

        public async Task<string> UploadServiceImageAsync(IFormFile file, int serviceId)
        {
            return await UploadImageAsync(file, $"services/{serviceId}");
        }

        public async Task<string> UploadPortfolioImageAsync(IFormFile file, string providerId)
        {
            return await UploadImageAsync(file, $"portfolio/{providerId}");
        }

        public async Task<bool> DeleteImageAsync(string imageUrl)
        {
            try
            {
                // Extract relative path from URL
                var uri = new Uri(imageUrl);
                var relativePath = uri.AbsolutePath.TrimStart('/');
                
                if (relativePath.StartsWith("uploads/"))
                {
                    var filePath = Path.Combine(_options.UploadPath, relativePath.Substring(8));
                    
                    if (File.Exists(filePath))
                    {
                        File.Delete(filePath);
                        return true;
                    }
                }
                
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting image: {ImageUrl}", imageUrl);
                return false;
            }
        }

        public bool IsValidImageFile(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return false;

            if (file.Length > _options.MaxFileSize)
                return false;

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            return _options.AllowedExtensions.Contains(extension);
        }
    }
}
