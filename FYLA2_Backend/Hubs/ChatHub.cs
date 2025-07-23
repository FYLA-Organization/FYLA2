using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace FYLA2_Backend.Hubs
{
  [Authorize]
  public class ChatHub : Hub
  {
    private readonly ILogger<ChatHub> _logger;

    public ChatHub(ILogger<ChatHub> logger)
    {
      _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
      var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
      if (!string.IsNullOrEmpty(userId))
      {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        _logger.LogInformation("User {UserId} connected to chat hub with connection {ConnectionId}", userId, Context.ConnectionId);
      }
      await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
      var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
      if (!string.IsNullOrEmpty(userId))
      {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
        _logger.LogInformation("User {UserId} disconnected from chat hub", userId);
      }
      await base.OnDisconnectedAsync(exception);
    }

    public async Task JoinUserGroup(string userId)
    {
      await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
    }

    public async Task LeaveUserGroup(string userId)
    {
      await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
    }

    public async Task SendTyping(string receiverId)
    {
      var senderId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
      if (!string.IsNullOrEmpty(senderId))
      {
        await Clients.Group($"user_{receiverId}").SendAsync("UserTyping", senderId);
      }
    }

    public async Task StopTyping(string receiverId)
    {
      var senderId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
      if (!string.IsNullOrEmpty(senderId))
      {
        await Clients.Group($"user_{receiverId}").SendAsync("UserStoppedTyping", senderId);
      }
    }
  }
}
