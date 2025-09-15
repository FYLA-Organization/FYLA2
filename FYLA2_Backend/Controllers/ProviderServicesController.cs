using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYLA2_Backend.Data;
using FYLA2_Backend.Models;
using FYLA2_Backend.DTOs;
using FYLA2_Backend.Services;
using System.Security.Claims;
using System.Text.Json;

namespace FYLA2_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProviderServicesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IFileUploadService _fileUploadService;
        private readonly ILogger<ProviderServicesController> _logger;

        public ProviderServicesController(
            ApplicationDbContext context,
            IFileUploadService fileUploadService,
            ILogger<ProviderServicesController> logger)
        {
            _context = context;
            _fileUploadService = fileUploadService;
            _logger = logger;
        }

        private string GetCurrentUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
        }

        // GET: api/services/provider/{providerId}
        [HttpGet("provider/{providerId}")]
        public async Task<ActionResult<List<ServiceDto>>> GetProviderServices(string providerId)
        {
            var services = await _context.Services
                .Include(s => s.Provider)
                .Where(s => s.ProviderId == providerId)
                .OrderBy(s => s.Name)
                .ToListAsync();

            var serviceDtos = new List<ServiceDto>();
            foreach (var service in services)
            {
                var dto = await MapToServiceDto(service);
                serviceDtos.Add(dto);
            }

            return Ok(serviceDtos);
        }

        // GET: api/services/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<ServiceDto>> GetService(int id)
        {
            var service = await _context.Services
                .Include(s => s.Provider)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (service == null)
            {
                return NotFound();
            }

            var dto = await MapToServiceDto(service);
            return Ok(dto);
        }

        // POST: api/services
        [HttpPost]
        public async Task<ActionResult<ServiceDto>> CreateService([FromForm] CreateServiceDto dto)
        {
            var currentUserId = GetCurrentUserId();

            string? imageUrl = null;
            if (dto.Image != null)
            {
                if (!_fileUploadService.IsValidImageFile(dto.Image))
                {
                    return BadRequest("Invalid image file");
                }

                try
                {
                    // We'll update this with the actual service ID after creation
                    imageUrl = await _fileUploadService.UploadImageAsync(dto.Image, "services/temp");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error uploading service image");
                    return StatusCode(500, "Error uploading image");
                }
            }

            var service = new Service
            {
                Name = dto.Name,
                Description = dto.Description,
                Price = dto.Price,
                DurationMinutes = dto.DurationMinutes,
                Category = dto.Category,
                ImageUrl = imageUrl,
                ProviderId = currentUserId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Services.Add(service);
            await _context.SaveChangesAsync();

            // Move image to correct folder with service ID
            if (imageUrl != null)
            {
                try
                {
                    var newImageUrl = await _fileUploadService.UploadServiceImageAsync(dto.Image!, service.Id);
                    
                    // Delete temp image and update service with new URL
                    await _fileUploadService.DeleteImageAsync(imageUrl);
                    service.ImageUrl = newImageUrl;
                    await _context.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error moving service image to final location");
                    // Continue with temp URL if moving fails
                }
            }

            // Add service add-ons
            if (dto.AddOns?.Any() == true)
            {
                foreach (var addOnDto in dto.AddOns)
                {
                    var addOn = new ServiceAddOn
                    {
                        ServiceId = service.Id,
                        Name = addOnDto.Name,
                        Description = addOnDto.Description,
                        Price = addOnDto.Price,
                        DurationMinutes = addOnDto.DurationMinutes,
                        IsRequired = addOnDto.IsRequired,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.ServiceAddOns.Add(addOn);
                }
                await _context.SaveChangesAsync();
            }

            var responseDto = await MapToServiceDto(service);
            return CreatedAtAction(nameof(GetService), new { id = service.Id }, responseDto);
        }

        // PUT: api/services/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<ServiceDto>> UpdateService(int id, [FromForm] UpdateServiceDto dto)
        {
            var currentUserId = GetCurrentUserId();

            var service = await _context.Services
                .FirstOrDefaultAsync(s => s.Id == id && s.ProviderId == currentUserId);

            if (service == null)
            {
                return NotFound();
            }

            // Update basic properties
            if (!string.IsNullOrEmpty(dto.Name))
                service.Name = dto.Name;
            if (dto.Description != null)
                service.Description = dto.Description;
            if (dto.Price.HasValue)
                service.Price = dto.Price.Value;
            if (dto.DurationMinutes.HasValue)
                service.DurationMinutes = dto.DurationMinutes.Value;
            if (!string.IsNullOrEmpty(dto.Category))
                service.Category = dto.Category;
            if (dto.IsActive.HasValue)
                service.IsActive = dto.IsActive.Value;

            // Handle image update
            if (dto.Image != null)
            {
                if (!_fileUploadService.IsValidImageFile(dto.Image))
                {
                    return BadRequest("Invalid image file");
                }

                try
                {
                    // Delete old image if exists
                    if (!string.IsNullOrEmpty(service.ImageUrl))
                    {
                        await _fileUploadService.DeleteImageAsync(service.ImageUrl);
                    }

                    // Upload new image
                    var newImageUrl = await _fileUploadService.UploadServiceImageAsync(dto.Image, service.Id);
                    service.ImageUrl = newImageUrl;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error updating service image for service {ServiceId}", id);
                    return StatusCode(500, "Error updating image");
                }
            }

            service.UpdatedAt = DateTime.UtcNow;

            // Update add-ons if provided
            if (dto.AddOns != null)
            {
                // Remove existing add-ons
                var existingAddOns = await _context.ServiceAddOns
                    .Where(sao => sao.ServiceId == id)
                    .ToListAsync();
                _context.ServiceAddOns.RemoveRange(existingAddOns);

                // Add new add-ons
                foreach (var addOnDto in dto.AddOns)
                {
                    var addOn = new ServiceAddOn
                    {
                        ServiceId = service.Id,
                        Name = addOnDto.Name,
                        Description = addOnDto.Description,
                        Price = addOnDto.Price,
                        DurationMinutes = addOnDto.DurationMinutes,
                        IsRequired = addOnDto.IsRequired,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.ServiceAddOns.Add(addOn);
                }
            }

            await _context.SaveChangesAsync();

            var responseDto = await MapToServiceDto(service);
            return Ok(responseDto);
        }

        // DELETE: api/services/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteService(int id)
        {
            var currentUserId = GetCurrentUserId();

            var service = await _context.Services
                .FirstOrDefaultAsync(s => s.Id == id && s.ProviderId == currentUserId);

            if (service == null)
            {
                return NotFound();
            }

            // Check if service has active bookings
            var hasActiveBookings = await _context.Bookings
                .AnyAsync(b => b.ServiceId == id && b.Status != BookingStatus.Completed && b.Status != BookingStatus.Cancelled);

            if (hasActiveBookings)
            {
                return BadRequest("Cannot delete service with active bookings");
            }

            try
            {
                // Delete service image if exists
                if (!string.IsNullOrEmpty(service.ImageUrl))
                {
                    await _fileUploadService.DeleteImageAsync(service.ImageUrl);
                }

                // Remove service add-ons
                var addOns = await _context.ServiceAddOns
                    .Where(sao => sao.ServiceId == id)
                    .ToListAsync();
                _context.ServiceAddOns.RemoveRange(addOns);

                // Remove service
                _context.Services.Remove(service);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Service deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting service {ServiceId}", id);
                return StatusCode(500, "Error deleting service");
            }
        }

        // POST: api/services/{serviceId}/addons
        [HttpPost("{serviceId}/addons")]
        public async Task<ActionResult<ServiceAddOnDto>> CreateServiceAddOn(int serviceId, CreateServiceAddOnDto dto)
        {
            var currentUserId = GetCurrentUserId();

            var service = await _context.Services
                .FirstOrDefaultAsync(s => s.Id == serviceId && s.ProviderId == currentUserId);

            if (service == null)
            {
                return NotFound("Service not found");
            }

            var addOn = new ServiceAddOn
            {
                ServiceId = serviceId,
                Name = dto.Name,
                Description = dto.Description,
                Price = dto.Price,
                DurationMinutes = dto.DurationMinutes,
                IsRequired = dto.IsRequired,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.ServiceAddOns.Add(addOn);
            await _context.SaveChangesAsync();

            var responseDto = new ServiceAddOnDto
            {
                Id = addOn.Id,
                Name = addOn.Name,
                Description = addOn.Description,
                Price = addOn.Price,
                DurationMinutes = addOn.DurationMinutes,
                IsRequired = addOn.IsRequired,
                IsActive = addOn.IsActive
            };

            return CreatedAtAction(nameof(GetService), new { id = serviceId }, responseDto);
        }

        // PUT: api/services/{serviceId}/addons/{addOnId}
        [HttpPut("{serviceId}/addons/{addOnId}")]
        public async Task<ActionResult<ServiceAddOnDto>> UpdateServiceAddOn(
            int serviceId, 
            int addOnId, 
            CreateServiceAddOnDto dto)
        {
            var currentUserId = GetCurrentUserId();

            var service = await _context.Services
                .FirstOrDefaultAsync(s => s.Id == serviceId && s.ProviderId == currentUserId);

            if (service == null)
            {
                return NotFound("Service not found");
            }

            var addOn = await _context.ServiceAddOns
                .FirstOrDefaultAsync(sao => sao.Id == addOnId && sao.ServiceId == serviceId);

            if (addOn == null)
            {
                return NotFound("Add-on not found");
            }

            addOn.Name = dto.Name;
            addOn.Description = dto.Description;
            addOn.Price = dto.Price;
            addOn.DurationMinutes = dto.DurationMinutes;
            addOn.IsRequired = dto.IsRequired;
            addOn.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var responseDto = new ServiceAddOnDto
            {
                Id = addOn.Id,
                Name = addOn.Name,
                Description = addOn.Description,
                Price = addOn.Price,
                DurationMinutes = addOn.DurationMinutes,
                IsRequired = addOn.IsRequired,
                IsActive = addOn.IsActive
            };

            return Ok(responseDto);
        }

        // DELETE: api/services/{serviceId}/addons/{addOnId}
        [HttpDelete("{serviceId}/addons/{addOnId}")]
        public async Task<ActionResult> DeleteServiceAddOn(int serviceId, int addOnId)
        {
            var currentUserId = GetCurrentUserId();

            var service = await _context.Services
                .FirstOrDefaultAsync(s => s.Id == serviceId && s.ProviderId == currentUserId);

            if (service == null)
            {
                return NotFound("Service not found");
            }

            var addOn = await _context.ServiceAddOns
                .FirstOrDefaultAsync(sao => sao.Id == addOnId && sao.ServiceId == serviceId);

            if (addOn == null)
            {
                return NotFound("Add-on not found");
            }

            _context.ServiceAddOns.Remove(addOn);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Add-on deleted successfully" });
        }

        private async Task<ServiceDto> MapToServiceDto(Service service)
        {
            var addOns = await _context.ServiceAddOns
                .Where(sao => sao.ServiceId == service.Id && sao.IsActive)
                .Select(sao => new ServiceAddOnDto
                {
                    Id = sao.Id,
                    Name = sao.Name,
                    Description = sao.Description,
                    Price = sao.Price,
                    DurationMinutes = sao.DurationMinutes,
                    IsRequired = sao.IsRequired,
                    IsActive = sao.IsActive
                })
                .ToListAsync();

            return new ServiceDto
            {
                Id = service.Id,
                Name = service.Name,
                Description = service.Description,
                Price = service.Price,
                DurationMinutes = service.DurationMinutes,
                ImageUrl = service.ImageUrl,
                Category = service.Category,
                IsActive = service.IsActive,
                ProviderId = service.ProviderId,
                AddOns = addOns,
                CreatedAt = service.CreatedAt,
                UpdatedAt = service.UpdatedAt
            };
        }
    }
}
