using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace FYLA2.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ILogger<AuthController> _logger;
        private readonly IConfiguration _configuration;

        public AuthController(ILogger<AuthController> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public ActionResult<LoginResponse> Login([FromBody] LoginRequest request)
        {
            try
            {
                _logger.LogInformation($"Login attempt for email: {request.Email}");

                // Mock authentication - replace with actual user validation
                var user = ValidateUser(request.Email, request.Password);
                if (user == null)
                {
                    return Unauthorized(new { message = "Invalid credentials" });
                }

                var token = GenerateJwtToken(user);

                var response = new LoginResponse
                {
                    Token = token,
                    User = user,
                    ExpiresIn = 86400, // 24 hours
                    TokenType = "Bearer"
                };

                _logger.LogInformation($"Login successful for user: {user.Email}");
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("register")]
        public ActionResult<RegisterResponse> Register([FromBody] RegisterRequest request)
        {
            try
            {
                _logger.LogInformation($"Registration attempt for email: {request.Email}");

                // Check if user already exists (mock check)
                if (UserExists(request.Email))
                {
                    return BadRequest(new { message = "User already exists" });
                }

                // Create new user (mock creation)
                var user = CreateUser(request);
                var token = GenerateJwtToken(user);

                var response = new RegisterResponse
                {
                    Token = token,
                    User = user,
                    ExpiresIn = 86400,
                    TokenType = "Bearer"
                };

                _logger.LogInformation($"Registration successful for user: {user.Email}");
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during registration");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("refresh")]
        [Authorize]
        public ActionResult<RefreshTokenResponse> RefreshToken()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                var user = GetUserById(userId);
                if (user == null)
                {
                    return Unauthorized();
                }

                var newToken = GenerateJwtToken(user);

                var response = new RefreshTokenResponse
                {
                    Token = newToken,
                    ExpiresIn = 86400,
                    TokenType = "Bearer"
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing token");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("logout")]
        [Authorize]
        public ActionResult Logout()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                _logger.LogInformation($"User {userId} logged out");

                // In a real app, you might invalidate the token or add it to a blacklist
                return Ok(new { message = "Logged out successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during logout");
                return StatusCode(500, "Internal server error");
            }
        }

        // Mock helper methods - replace with actual database operations
        private UserDto? ValidateUser(string email, string password)
        {
            // Mock users for development
            var mockUsers = new List<UserDto>
            {
                new UserDto
                {
                    Id = "1",
                    Email = "client1@fyla2.com",
                    FirstName = "Sarah",
                    LastName = "Johnson",
                    IsServiceProvider = false,
                    ProfilePictureUrl = "https://picsum.photos/150/150?random=1"
                },
                new UserDto
                {
                    Id = "2",
                    Email = "provider1@fyla2.com",
                    FirstName = "Elite",
                    LastName = "Beauty Studio",
                    IsServiceProvider = true,
                    ProfilePictureUrl = "https://picsum.photos/150/150?random=2"
                },
                new UserDto
                {
                    Id = "3",
                    Email = "provider2@fyla2.com",
                    FirstName = "Glamour",
                    LastName = "Salon",
                    IsServiceProvider = true,
                    ProfilePictureUrl = "https://picsum.photos/150/150?random=3"
                }
            };

            return mockUsers.FirstOrDefault(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
        }

        private bool UserExists(string email)
        {
            return ValidateUser(email, "") != null;
        }

        private UserDto CreateUser(RegisterRequest request)
        {
            return new UserDto
            {
                Id = Guid.NewGuid().ToString(),
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                IsServiceProvider = request.IsServiceProvider,
                ProfilePictureUrl = "https://picsum.photos/150/150?random=" + new Random().Next(1, 100)
            };
        }

        private UserDto? GetUserById(string userId)
        {
            // Mock implementation
            return new UserDto
            {
                Id = userId,
                Email = "user@fyla2.com",
                FirstName = "Mock",
                LastName = "User",
                IsServiceProvider = false
            };
        }

        private string GenerateJwtToken(UserDto user)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("your-very-secure-secret-key-that-is-at-least-32-characters-long"));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, $"{user.FirstName} {user.LastName}"),
                new Claim("IsServiceProvider", user.IsServiceProvider.ToString())
            };

            var token = new JwtSecurityToken(
                issuer: "FYLA2",
                audience: "FYLA2",
                claims: claims,
                expires: DateTime.Now.AddDays(1),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    // DTOs
    public class LoginRequest
    {
        public string Email { get; set; } = "";
        public string Password { get; set; } = "";
    }

    public class LoginResponse
    {
        public string Token { get; set; } = "";
        public UserDto User { get; set; } = new();
        public int ExpiresIn { get; set; }
        public string TokenType { get; set; } = "";
    }

    public class RegisterRequest
    {
        public string Email { get; set; } = "";
        public string Password { get; set; } = "";
        public string FirstName { get; set; } = "";
        public string LastName { get; set; } = "";
        public bool IsServiceProvider { get; set; }
    }

    public class RegisterResponse
    {
        public string Token { get; set; } = "";
        public UserDto User { get; set; } = new();
        public int ExpiresIn { get; set; }
        public string TokenType { get; set; } = "";
    }

    public class RefreshTokenResponse
    {
        public string Token { get; set; } = "";
        public int ExpiresIn { get; set; }
        public string TokenType { get; set; } = "";
    }

    public class UserDto
    {
        public string Id { get; set; } = "";
        public string Email { get; set; } = "";
        public string FirstName { get; set; } = "";
        public string LastName { get; set; } = "";
        public bool IsServiceProvider { get; set; }
        public string? ProfilePictureUrl { get; set; }
    }
}
