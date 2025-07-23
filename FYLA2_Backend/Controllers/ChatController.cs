using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using FYLA2_Backend.Data;
using FYLA2_Backend.Models;
using FYLA2_Backend.Hubs;
using System.Security.Claims;

namespace FYLA2_Backend.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  [Authorize]
  public class ChatController : ControllerBase
  {
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ChatController> _logger;
    private readonly IHubContext<ChatHub> _hubContext;

    public ChatController(ApplicationDbContext context, ILogger<ChatController> logger, IHubContext<ChatHub> hubContext)
    {
      _context = context;
      _logger = logger;
      _hubContext = hubContext;
    }

    // GET: api/chat/rooms
    [HttpGet("rooms")]
    public async Task<ActionResult<IEnumerable<object>>> GetChatRooms()
    {
      var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (string.IsNullOrEmpty(userId))
        return Unauthorized();

      // Get all conversations where the user is a participant
      var conversations = await _context.Messages
          .Where(m => m.SenderId == userId || m.ReceiverId == userId)
          .GroupBy(m => m.SenderId == userId ? m.ReceiverId : m.SenderId)
          .Select(g => new
          {
            userId = g.Key,
            lastMessage = g.OrderByDescending(m => m.Timestamp).First(),
            unreadCount = g.Count(m => m.ReceiverId == userId && !m.IsRead)
          })
          .ToListAsync();

      // Get user details for each conversation
      var chatRooms = new List<object>();
      foreach (var conv in conversations)
      {
        var otherUser = await _context.Users.FindAsync(conv.userId);
        if (otherUser != null)
        {
          chatRooms.Add(new
          {
            id = conv.userId,
            user = new
            {
              id = otherUser.Id,
              firstName = otherUser.FirstName,
              lastName = otherUser.LastName,
              profilePictureUrl = otherUser.ProfileImageUrl
            },
            lastMessage = new
            {
              id = conv.lastMessage.Id.ToString(),
              content = conv.lastMessage.Content,
              timestamp = conv.lastMessage.Timestamp.ToString("yyyy-MM-ddTHH:mm:ssZ"),
              senderId = conv.lastMessage.SenderId
            },
            unreadCount = conv.unreadCount
          });
        }
      }

      return Ok(chatRooms.OrderByDescending(c => ((dynamic)c).lastMessage.timestamp));
    }

    // GET: api/chat/{userId}/messages
    [HttpGet("{userId}/messages")]
    public async Task<ActionResult<IEnumerable<object>>> GetChatMessages(string userId)
    {
      var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (string.IsNullOrEmpty(currentUserId))
        return Unauthorized();

      var messages = await _context.Messages
          .Where(m => (m.SenderId == currentUserId && m.ReceiverId == userId) ||
                     (m.SenderId == userId && m.ReceiverId == currentUserId))
          .OrderBy(m => m.Timestamp)
          .Select(m => new
          {
            id = m.Id.ToString(),
            senderId = m.SenderId,
            receiverId = m.ReceiverId,
            content = m.Content,
            timestamp = m.Timestamp.ToString("yyyy-MM-ddTHH:mm:ssZ"),
            isRead = m.IsRead,
            messageType = m.MessageType
          })
          .ToListAsync();

      // Mark messages as read
      var unreadMessages = await _context.Messages
          .Where(m => m.SenderId == userId && m.ReceiverId == currentUserId && !m.IsRead)
          .ToListAsync();

      foreach (var message in unreadMessages)
      {
        message.IsRead = true;
      }

      if (unreadMessages.Any())
      {
        await _context.SaveChangesAsync();
      }

      return Ok(messages);
    }

    // POST: api/chat/send
    [HttpPost("send")]
    public async Task<ActionResult<object>> SendMessage([FromBody] SendMessageRequest request)
    {
      var senderId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (string.IsNullOrEmpty(senderId))
        return Unauthorized();

      // Validate receiver exists
      var receiver = await _context.Users.FindAsync(request.ReceiverId);
      if (receiver == null)
        return BadRequest("Receiver not found");

      var message = new Message
      {
        SenderId = senderId,
        ReceiverId = request.ReceiverId,
        Content = request.Content,
        MessageType = request.MessageType ?? "text",
        Timestamp = DateTime.UtcNow,
        IsRead = false
      };

      _context.Messages.Add(message);
      await _context.SaveChangesAsync();

      var messageResponse = new
      {
        id = message.Id.ToString(),
        senderId = message.SenderId,
        receiverId = message.ReceiverId,
        content = message.Content,
        timestamp = message.Timestamp.ToString("yyyy-MM-ddTHH:mm:ssZ"),
        isRead = message.IsRead,
        messageType = message.MessageType
      };

      // Send real-time notification to receiver
      await _hubContext.Clients.Group($"user_{request.ReceiverId}")
          .SendAsync("ReceiveMessage", messageResponse);

      return Ok(messageResponse);
    }

    // PUT: api/chat/messages/{messageId}/read
    [HttpPut("messages/{messageId}/read")]
    public async Task<ActionResult> MarkMessageAsRead(int messageId)
    {
      var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (string.IsNullOrEmpty(userId))
        return Unauthorized();

      var message = await _context.Messages.FindAsync(messageId);
      if (message == null)
        return NotFound();

      // Only the receiver can mark a message as read
      if (message.ReceiverId != userId)
        return Forbid();

      message.IsRead = true;
      await _context.SaveChangesAsync();

      return Ok();
    }

    // GET: api/chat/unread-count
    [HttpGet("unread-count")]
    public async Task<ActionResult<object>> GetUnreadCount()
    {
      var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (string.IsNullOrEmpty(userId))
        return Unauthorized();

      var unreadCount = await _context.Messages
          .CountAsync(m => m.ReceiverId == userId && !m.IsRead);

      return Ok(new { unreadCount });
    }
  }

  // DTOs
  public class SendMessageRequest
  {
    public string ReceiverId { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? MessageType { get; set; } = "text";
  }
}
