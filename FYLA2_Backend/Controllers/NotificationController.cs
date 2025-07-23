using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYLA2_Backend.Data;
using FYLA2_Backend.Models;
using System.Security.Claims;
using System.Text.Json;
using System.Text;

namespace FYLA2_Backend.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  [Authorize]
  public class NotificationController : ControllerBase
  {
    private readonly ApplicationDbContext _context;
    private readonly ILogger<NotificationController> _logger;
    private readonly HttpClient _httpClient;

    public NotificationController(
        ApplicationDbContext context,
        ILogger<NotificationController> logger,
        HttpClient httpClient)
    {
      _context = context;
      _logger = logger;
      _httpClient = httpClient;
    }

    // POST: api/notification/register-token
    [HttpPost("register-token")]
    public async Task<ActionResult> RegisterPushToken([FromBody] RegisterPushTokenRequest request)
    {
      var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (string.IsNullOrEmpty(userId))
        return Unauthorized();

      try
      {
        // Check if token already exists for this user and platform
        var existingToken = await _context.PushTokens
            .FirstOrDefaultAsync(pt => pt.UserId == userId && pt.Platform == request.Platform);

        if (existingToken != null)
        {
          // Update existing token
          existingToken.Token = request.PushToken;
          existingToken.UpdatedAt = DateTime.UtcNow;
          existingToken.IsActive = true;
        }
        else
        {
          // Create new token
          var pushToken = new PushToken
          {
            UserId = userId,
            Token = request.PushToken,
            Platform = request.Platform,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsActive = true
          };

          _context.PushTokens.Add(pushToken);
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Push token registered successfully" });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error registering push token for user {UserId}", userId);
        return StatusCode(500, "Internal server error");
      }
    }

    // DELETE: api/notification/unregister-token
    [HttpDelete("unregister-token")]
    public async Task<ActionResult> UnregisterPushToken()
    {
      var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (string.IsNullOrEmpty(userId))
        return Unauthorized();

      try
      {
        var tokens = await _context.PushTokens
            .Where(pt => pt.UserId == userId)
            .ToListAsync();

        foreach (var token in tokens)
        {
          token.IsActive = false;
          token.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Push tokens unregistered successfully" });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error unregistering push tokens for user {UserId}", userId);
        return StatusCode(500, "Internal server error");
      }
    }

    // POST: api/notification/send-to-user/{userId}
    [HttpPost("send-to-user/{userId}")]
    public async Task<ActionResult> SendNotificationToUser(string userId, [FromBody] SendNotificationRequest request)
    {
      var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (string.IsNullOrEmpty(currentUserId))
        return Unauthorized();

      try
      {
        var pushTokens = await _context.PushTokens
            .Where(pt => pt.UserId == userId && pt.IsActive)
            .ToListAsync();

        if (!pushTokens.Any())
        {
          return Ok(new { message = "No active push tokens found for user" });
        }

        var sent = 0;
        foreach (var pushToken in pushTokens)
        {
          var success = await SendExpoPushNotification(pushToken.Token, request.Title, request.Body, request.Data);
          if (success) sent++;
        }

        return Ok(new { message = $"Notification sent to {sent} devices" });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error sending notification to user {UserId}", userId);
        return StatusCode(500, "Internal server error");
      }
    }

    private async Task<bool> SendExpoPushNotification(string pushToken, string title, string body, object? data = null)
    {
      try
      {
        var notification = new
        {
          to = pushToken,
          title = title,
          body = body,
          data = data ?? new { },
          sound = "default",
          priority = "high"
        };

        var json = JsonSerializer.Serialize(notification);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync("https://exp.host/--/api/v2/push/send", content);

        if (response.IsSuccessStatusCode)
        {
          _logger.LogInformation("Push notification sent successfully to token: {Token}", pushToken.Substring(0, 10) + "...");
          return true;
        }
        else
        {
          var errorContent = await response.Content.ReadAsStringAsync();
          _logger.LogWarning("Failed to send push notification. Status: {Status}, Error: {Error}", response.StatusCode, errorContent);
          return false;
        }
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Exception while sending push notification to token: {Token}", pushToken.Substring(0, 10) + "...");
        return false;
      }
    }
  }

  // DTOs
  public class RegisterPushTokenRequest
  {
    public string PushToken { get; set; } = string.Empty;
    public string Platform { get; set; } = string.Empty;
  }

  public class SendNotificationRequest
  {
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public object? Data { get; set; }
  }
}
