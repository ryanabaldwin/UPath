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

        return Ok(new LoginResponse(
            Id: user.Id.ToString(),
            Username: user.Username,
            Email: user.Email,
            FirstName: user.FirstName,
            LastName: user.LastName,
            Role: user.Role
        ));
    }
}
