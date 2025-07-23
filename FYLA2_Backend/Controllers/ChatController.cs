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
            messageType = m.MessageType,
            status = m.Status.ToString(),
            deliveredAt = m.DeliveredAt.HasValue ? m.DeliveredAt.Value.ToString("yyyy-MM-ddTHH:mm:ssZ") : null,
            readAt = m.ReadAt.HasValue ? m.ReadAt.Value.ToString("yyyy-MM-ddTHH:mm:ssZ") : null,
            attachmentUrl = m.AttachmentUrl,
            attachmentType = m.AttachmentType,
            attachmentSize = m.AttachmentSize,
            attachmentName = m.AttachmentName
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
        IsRead = false,
        Status = Models.MessageStatus.Sent,
        AttachmentUrl = request.AttachmentUrl,
        AttachmentType = request.AttachmentType,
        AttachmentSize = request.AttachmentSize,
        AttachmentName = request.AttachmentName
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
        messageType = message.MessageType,
        status = message.Status.ToString(),
        deliveredAt = message.DeliveredAt?.ToString("yyyy-MM-ddTHH:mm:ssZ"),
        readAt = message.ReadAt?.ToString("yyyy-MM-ddTHH:mm:ssZ"),
        attachmentUrl = message.AttachmentUrl,
        attachmentType = message.AttachmentType,
        attachmentSize = message.AttachmentSize,
        attachmentName = message.AttachmentName
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
      if (message == null || message.ReceiverId != userId)
        return NotFound();

      if (!message.IsRead)
      {
        message.IsRead = true;
        message.Status = Models.MessageStatus.Read;
        message.ReadAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Notify sender via SignalR
        await _hubContext.Clients.Group($"user_{message.SenderId}")
            .SendAsync("MessageRead", messageId, userId);
      }

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

    // PUT: api/chat/messages/{messageId}/delivered
    [HttpPut("messages/{messageId}/delivered")]
    public async Task<ActionResult> MarkMessageAsDelivered(int messageId)
    {
      var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (string.IsNullOrEmpty(userId))
        return Unauthorized();

      var message = await _context.Messages.FindAsync(messageId);
      if (message == null || message.ReceiverId != userId)
        return NotFound();

      if (message.Status == Models.MessageStatus.Sent)
      {
        message.Status = Models.MessageStatus.Delivered;
        message.DeliveredAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Notify sender via SignalR
        await _hubContext.Clients.Group($"user_{message.SenderId}")
            .SendAsync("MessageDelivered", messageId, userId);
      }

      return Ok();
    }

    // PUT: api/chat/conversations/{userId}/mark-all-read
    [HttpPut("conversations/{otherUserId}/mark-all-read")]
    public async Task<ActionResult> MarkAllMessagesAsRead(string otherUserId)
    {
      var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (string.IsNullOrEmpty(userId))
        return Unauthorized();

      var unreadMessages = await _context.Messages
          .Where(m => m.SenderId == otherUserId && m.ReceiverId == userId && !m.IsRead)
          .ToListAsync();

      if (unreadMessages.Any())
      {
        var now = DateTime.UtcNow;
        foreach (var message in unreadMessages)
        {
          message.IsRead = true;
          message.Status = Models.MessageStatus.Read;
          message.ReadAt = now;
        }

        await _context.SaveChangesAsync();

        // Notify sender via SignalR
        var messageIds = unreadMessages.Select(m => m.Id).ToList();
        await _hubContext.Clients.Group($"user_{otherUserId}")
            .SendAsync("MessagesRead", messageIds, userId);
      }

      return Ok();
    }
  }

  // DTOs
  public class SendMessageRequest
  {
    public string ReceiverId { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? MessageType { get; set; } = "text";
    public string? AttachmentUrl { get; set; }
    public string? AttachmentType { get; set; }
    public long? AttachmentSize { get; set; }
    public string? AttachmentName { get; set; }
  }

  public class MessageDTO
  {
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string SenderId { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public bool IsFromCurrentUser { get; set; }
    public bool IsRead { get; set; }
    public MessageStatus Status { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public DateTime? ReadAt { get; set; }
    public string? AttachmentUrl { get; set; }
    public string? AttachmentType { get; set; }
    public long? AttachmentSize { get; set; }
    public string? AttachmentName { get; set; }
  }
}
