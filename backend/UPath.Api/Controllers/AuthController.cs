using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UPath.Api.Data;

namespace UPath.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;

    public AuthController(AppDbContext db) => _db = db;

    public record LoginRequest(string Username, string Password);

    public record LoginResponse(
        string Id,
        string Username,
        string Email,
        string FirstName,
        string LastName,
        string Role
    );

    /// <summary>
    /// Authenticate a user with username and password.
    /// POST /api/auth/login
    /// </summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { error = "Username and password are required" });
        }

        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Username.ToLower() == request.Username.ToLower());

        if (user is null)
        {
            return Unauthorized(new { error = "Invalid username or password" });
        }

        // For now, simple plaintext comparison (in production, use proper hashing like BCrypt)
        // The schema uses pgcrypto extension, so passwords could be hashed with crypt()
        if (user.Password != request.Password)
        {
            return Unauthorized(new { error = "Invalid username or password" });
        }

        // Store user info in session
        HttpContext.Session.SetString("UserId", user.Id.ToString());
        HttpContext.Session.SetString("UserRole", user.Role);

        return Ok(new LoginResponse(
            Id: user.Id.ToString(),
            Username: user.Username,
            Email: user.Email,
            FirstName: user.FirstName,
            LastName: user.LastName,
            Role: user.Role
        ));
    }

    /// <summary>
    /// Return the currently authenticated user (session check).
    /// GET /api/auth/me
    /// </summary>
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userIdStr = HttpContext.Session.GetString("UserId");
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
        {
            return Unauthorized(new { error = "Not authenticated" });
        }

        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user is null)
        {
            // Session references a deleted user — clear it
            HttpContext.Session.Clear();
            return Unauthorized(new { error = "Not authenticated" });
        }

        return Ok(new LoginResponse(
            Id: user.Id.ToString(),
            Username: user.Username,
            Email: user.Email,
            FirstName: user.FirstName,
            LastName: user.LastName,
            Role: user.Role
        ));
    }

    /// <summary>
    /// Sign out the current user by clearing the session.
    /// POST /api/auth/logout
    /// </summary>
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        HttpContext.Session.Clear();
        return Ok(new { ok = true });
    }
}
