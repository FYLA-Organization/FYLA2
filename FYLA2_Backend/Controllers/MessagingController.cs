using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace FYLA2_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MessagingController : ControllerBase
{
  private readonly ILogger<MessagingController> _logger;

  public MessagingController(ILogger<MessagingController> logger)
  {
    _logger = logger;
  }

  // GET: api/messaging/conversations
  [HttpGet("conversations")]
  public async Task<ActionResult<object[]>> GetConversations()
  {
    var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (string.IsNullOrEmpty(userId))
      return Unauthorized();

    _logger.LogInformation("User {UserId} requested conversations", userId);

    // Return empty array for now - will implement messaging in Phase 2B
    return Ok(new object[] { });
  }

  // GET: api/messaging/conversation/{userId}
  [HttpGet("conversation/{userId}")]
  public async Task<ActionResult<object[]>> GetConversationMessages(string userId)
  {
    var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (string.IsNullOrEmpty(currentUserId))
      return Unauthorized();

    _logger.LogInformation("User {CurrentUserId} requested conversation with {UserId}", currentUserId, userId);

    // Return empty array for now - will implement messaging in Phase 2B
    return Ok(new object[] { });
  }

  // POST: api/messaging/send
  [HttpPost("send")]
  public async Task<ActionResult<object>> SendMessage([FromBody] SendMessageRequest request)
  {
    var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (string.IsNullOrEmpty(userId))
      return Unauthorized();

    _logger.LogInformation("User {UserId} attempting to send message", userId);

    // Return success response for now - will implement messaging in Phase 2B
    return Ok(new
    {
      success = true,
      message = "Message functionality will be implemented in Phase 2B",
      timestamp = DateTime.UtcNow
    });
  }
}
