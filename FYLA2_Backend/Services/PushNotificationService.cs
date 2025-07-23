using Microsoft.EntityFrameworkCore;
using FYLA2_Backend.Data;
using FYLA2_Backend.Models;
using System.Text.Json;
using System.Text;

namespace FYLA2_Backend.Services
{
  public interface IPushNotificationService
  {
    Task SendMessageNotificationAsync(string receiverUserId, string senderName, string messageContent);
    Task SendBookingNotificationAsync(string receiverUserId, string title, string body, object? data = null);
    Task SendGeneralNotificationAsync(string receiverUserId, string title, string body, object? data = null);
  }

  public class PushNotificationService : IPushNotificationService
  {
    private readonly ApplicationDbContext _context;
    private readonly HttpClient _httpClient;
    private readonly ILogger<PushNotificationService> _logger;

    public PushNotificationService(
        ApplicationDbContext context,
        HttpClient httpClient,
        ILogger<PushNotificationService> logger)
    {
      _context = context;
      _httpClient = httpClient;
      _logger = logger;
    }

    public async Task SendMessageNotificationAsync(string receiverUserId, string senderName, string messageContent)
    {
      var title = $"New message from {senderName}";
      var body = messageContent.Length > 100 ? messageContent.Substring(0, 100) + "..." : messageContent;

      var data = new
      {
        type = "message",
        senderId = receiverUserId,
        timestamp = DateTime.UtcNow.ToString("O")
      };

      await SendNotificationToUserAsync(receiverUserId, title, body, data);
    }

    public async Task SendBookingNotificationAsync(string receiverUserId, string title, string body, object? data = null)
    {
      var notificationData = new
      {
        type = "booking",
        timestamp = DateTime.UtcNow.ToString("O"),
        customData = data
      };

      await SendNotificationToUserAsync(receiverUserId, title, body, notificationData);
    }

    public async Task SendGeneralNotificationAsync(string receiverUserId, string title, string body, object? data = null)
    {
      var notificationData = new
      {
        type = "general",
        timestamp = DateTime.UtcNow.ToString("O"),
        customData = data
      };

      await SendNotificationToUserAsync(receiverUserId, title, body, notificationData);
    }

    private async Task SendNotificationToUserAsync(string userId, string title, string body, object? data = null)
    {
      try
      {
        var pushTokens = await _context.PushTokens
            .Where(pt => pt.UserId == userId && pt.IsActive)
            .ToListAsync();

        if (!pushTokens.Any())
        {
          _logger.LogInformation("No active push tokens found for user {UserId}", userId);
          return;
        }

        var tasks = pushTokens.Select(pushToken =>
            SendExpoPushNotificationAsync(pushToken.Token, title, body, data));

        await Task.WhenAll(tasks);

        _logger.LogInformation("Push notifications sent to {Count} devices for user {UserId}", pushTokens.Count, userId);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error sending push notification to user {UserId}", userId);
      }
    }

    private async Task<bool> SendExpoPushNotificationAsync(string pushToken, string title, string body, object? data = null)
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
          priority = "high",
          channelId = "chat-messages"
        };

        var json = JsonSerializer.Serialize(notification);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync("https://exp.host/--/api/v2/push/send", content);

        if (response.IsSuccessStatusCode)
        {
          _logger.LogDebug("Push notification sent successfully to token: {Token}", pushToken.Substring(0, 10) + "...");
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
}
