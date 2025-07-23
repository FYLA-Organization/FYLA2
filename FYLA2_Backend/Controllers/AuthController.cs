using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FYLA2_Backend.Models;
using FYLA2_Backend.DTOs;
using Microsoft.AspNetCore.Authorization;

namespace FYLA2_Backend.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  public class AuthController : ControllerBase
  {
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly IConfiguration _configuration;

    public AuthController(
        UserManager<User> userManager,
        SignInManager<User> signInManager,
        IConfiguration configuration)
    {
      _userManager = userManager;
      _signInManager = signInManager;
      _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto model)
    {
      if (!ModelState.IsValid)
        return BadRequest(ModelState);

      var user = new User
      {
        UserName = model.Email,
        Email = model.Email,
        FirstName = model.FirstName,
        LastName = model.LastName,
        DateOfBirth = model.DateOfBirth ?? DateTime.Now.AddYears(-18), // Default to 18 years ago if not provided
        IsServiceProvider = model.IsServiceProvider,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
      }; var result = await _userManager.CreateAsync(user, model.Password);

      if (!result.Succeeded)
      {
        foreach (var error in result.Errors)
        {
          ModelState.AddModelError(string.Empty, error.Description);
        }
        return BadRequest(ModelState);
      }

      var token = await GenerateJwtToken(user);
      var userDto = new UserDto
      {
        Id = user.Id,
        Email = user.Email!,
        FirstName = user.FirstName,
        LastName = user.LastName,
        Bio = user.Bio,
        ProfileImageUrl = user.ProfileImageUrl,
        DateOfBirth = user.DateOfBirth,
        IsServiceProvider = user.IsServiceProvider,
        CreatedAt = user.CreatedAt
      };

      return Ok(new AuthResponseDto
      {
        Token = token,
        Expiration = DateTime.UtcNow.AddMinutes(int.Parse(_configuration["JwtSettings:ExpiryMinutes"] ?? "60")),
        User = userDto
      });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto model)
    {
      if (!ModelState.IsValid)
        return BadRequest(ModelState);

      var user = await _userManager.FindByEmailAsync(model.Email);
      if (user == null)
        return Unauthorized("Invalid email or password.");

      var result = await _signInManager.CheckPasswordSignInAsync(user, model.Password, false);
      if (!result.Succeeded)
        return Unauthorized("Invalid email or password.");

      var token = await GenerateJwtToken(user);
      var userDto = new UserDto
      {
        Id = user.Id,
        Email = user.Email!,
        FirstName = user.FirstName,
        LastName = user.LastName,
        Bio = user.Bio,
        ProfileImageUrl = user.ProfileImageUrl,
        DateOfBirth = user.DateOfBirth,
        IsServiceProvider = user.IsServiceProvider,
        CreatedAt = user.CreatedAt
      };

      return Ok(new AuthResponseDto
      {
        Token = token,
        Expiration = DateTime.UtcNow.AddMinutes(int.Parse(_configuration["JwtSettings:ExpiryMinutes"] ?? "60")),
        User = userDto
      });
    }

    private async Task<string> GenerateJwtToken(User user)
    {
      var jwtSettings = _configuration.GetSection("JwtSettings");
      var secretKey = jwtSettings["SecretKey"] ?? "YourSuperSecretKeyThatIsAtLeast32CharactersLong!";
      var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
      var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

      var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email, user.Email!),
                new Claim(ClaimTypes.Name, $"{user.FirstName} {user.LastName}"),
                new Claim("IsServiceProvider", user.IsServiceProvider.ToString())
            };

      var roles = await _userManager.GetRolesAsync(user);
      foreach (var role in roles)
      {
        claims.Add(new Claim(ClaimTypes.Role, role));
      }

      var token = new JwtSecurityToken(
          issuer: jwtSettings["Issuer"],
          audience: jwtSettings["Audience"],
          claims: claims,
          expires: DateTime.UtcNow.AddMinutes(int.Parse(jwtSettings["ExpiryMinutes"] ?? "60")),
          signingCredentials: credentials
      );

      return new JwtSecurityTokenHandler().WriteToken(token);
    }

    // Dev endpoints for testing
    [HttpPost("dev-login-client")]
    public async Task<IActionResult> DevLoginClient()
    {
      if (!_configuration.GetValue<bool>("IsDevelopment", false) &&
          Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") != "Development")
      {
        return NotFound();
      }

      var user = await _userManager.FindByEmailAsync("client1@fyla2.com");
      if (user == null)
        return NotFound("Dev client user not found");

      var token = await GenerateJwtToken(user);
      var userDto = new UserDto
      {
        Id = user.Id,
        Email = user.Email!,
        FirstName = user.FirstName,
        LastName = user.LastName,
        Bio = user.Bio,
        ProfileImageUrl = user.ProfileImageUrl,
        DateOfBirth = user.DateOfBirth,
        IsServiceProvider = user.IsServiceProvider,
        CreatedAt = user.CreatedAt
      };

      return Ok(new AuthResponseDto
      {
        Token = token,
        Expiration = DateTime.UtcNow.AddMinutes(int.Parse(_configuration["JwtSettings:ExpiryMinutes"] ?? "60")),
        User = userDto
      });
    }

    [HttpPost("dev-login-provider")]
    public async Task<IActionResult> DevLoginProvider()
    {
      if (!_configuration.GetValue<bool>("IsDevelopment", false) &&
          Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") != "Development")
      {
        return NotFound();
      }

      var user = await _userManager.FindByEmailAsync("provider1@fyla2.com");
      if (user == null)
        return NotFound("Dev provider user not found");

      var token = await GenerateJwtToken(user);
      var userDto = new UserDto
      {
        Id = user.Id,
        Email = user.Email!,
        FirstName = user.FirstName,
        LastName = user.LastName,
        Bio = user.Bio,
        ProfileImageUrl = user.ProfileImageUrl,
        DateOfBirth = user.DateOfBirth,
        IsServiceProvider = user.IsServiceProvider,
        CreatedAt = user.CreatedAt
      };

      return Ok(new AuthResponseDto
      {
        Token = token,
        Expiration = DateTime.UtcNow.AddMinutes(int.Parse(_configuration["JwtSettings:ExpiryMinutes"] ?? "60")),
        User = userDto
      });
    }

    [HttpPut("profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto model)
    {
      if (!ModelState.IsValid)
        return BadRequest(ModelState);

      var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (string.IsNullOrEmpty(userId))
        return Unauthorized();

      var user = await _userManager.FindByIdAsync(userId);
      if (user == null)
        return NotFound("User not found");

      // Update user fields if provided
      if (!string.IsNullOrEmpty(model.FirstName))
        user.FirstName = model.FirstName;

      if (!string.IsNullOrEmpty(model.LastName))
        user.LastName = model.LastName;

      if (model.Bio != null)
        user.Bio = model.Bio;

      if (model.ProfileImageUrl != null)
        user.ProfileImageUrl = model.ProfileImageUrl;

      if (model.DateOfBirth.HasValue)
        user.DateOfBirth = model.DateOfBirth.Value;

      user.UpdatedAt = DateTime.UtcNow;

      var result = await _userManager.UpdateAsync(user);
      if (!result.Succeeded)
      {
        foreach (var error in result.Errors)
        {
          ModelState.AddModelError(string.Empty, error.Description);
        }
        return BadRequest(ModelState);
      }

      var userDto = new UserDto
      {
        Id = user.Id,
        Email = user.Email!,
        FirstName = user.FirstName,
        LastName = user.LastName,
        Bio = user.Bio,
        ProfileImageUrl = user.ProfileImageUrl,
        DateOfBirth = user.DateOfBirth,
        IsServiceProvider = user.IsServiceProvider,
        CreatedAt = user.CreatedAt
      };

      return Ok(userDto);
    }
  }
}
