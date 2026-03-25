using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UPath.Api.Data;
using UPath.Api.Models;

namespace UPath.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AccountController : ControllerBase
{
    private readonly AppDbContext _db;

    public AccountController(AppDbContext db) => _db = db;

    public record RegisterRequest(
        string Email,
        string Password,
        string FirstName,
        string LastName,
        string? Username = null
    );

    public record OnboardingData(
        string Background,
        string Goal,
        string[] Interests,
        string Challenge,
        string WeeklyTime
    );

    public record CreateAccountRequest(
        RegisterRequest Registration,
        OnboardingData Onboarding
    );

    public record AccountResponse(
        string Id,
        string Username,
        string Email,
        string FirstName,
        string LastName,
        string Role,
        bool OnboardingComplete
    );

    /// <summary>
    /// Create a new user account with registration info and onboarding data.
    /// POST /api/account/register
    /// </summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] CreateAccountRequest request)
    {
        var reg = request.Registration;
        var onboarding = request.Onboarding;

        // Validate required fields
        if (string.IsNullOrWhiteSpace(reg.Email))
            return BadRequest(new { error = "Email is required" });
        if (string.IsNullOrWhiteSpace(reg.Password))
            return BadRequest(new { error = "Password is required" });
        if (reg.Password.Length < 8)
            return BadRequest(new { error = "Password must be at least 8 characters" });
        if (string.IsNullOrWhiteSpace(reg.FirstName))
            return BadRequest(new { error = "First name is required" });
        if (string.IsNullOrWhiteSpace(reg.LastName))
            return BadRequest(new { error = "Last name is required" });

        // Check if email already exists
        var emailExists = await _db.Users.AnyAsync(u => u.Email.ToLower() == reg.Email.ToLower());
        if (emailExists)
        {
            return Conflict(new { error = "An account with this email already exists" });
        }

        // Generate username if not provided
        var username = reg.Username;
        if (string.IsNullOrWhiteSpace(username))
        {
            username = GenerateUsername(reg.FirstName, reg.LastName);
        }

        // Check if username already exists and make unique if needed
        var baseUsername = username;
        var counter = 1;
        while (await _db.Users.AnyAsync(u => u.Username == username))
        {
            username = $"{baseUsername}{counter}";
            counter++;
        }

        // Create user
        var user = new User
        {
            Email = reg.Email.Trim().ToLower(),
            Password = reg.Password, // In production, hash with BCrypt
            FirstName = reg.FirstName.Trim(),
            LastName = reg.LastName.Trim(),
            Username = username,
            Role = "student"
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        // Create student preferences with onboarding data
        var preferences = new StudentPreference
        {
            UserId = user.Id,
            Background = onboarding.Background,
            Goal = onboarding.Goal,
            Interests = string.Join(",", onboarding.Interests),
            Challenge = onboarding.Challenge,
            WeeklyTime = onboarding.WeeklyTime,
            SelectedCareerPaths = "[]",
            UpdatedAt = DateTimeOffset.UtcNow
        };

        _db.StudentPreferences.Add(preferences);
        await _db.SaveChangesAsync();

        return CreatedAtAction(
            nameof(Register),
            new { id = user.Id },
            new AccountResponse(
                Id: user.Id.ToString(),
                Username: user.Username,
                Email: user.Email,
                FirstName: user.FirstName,
                LastName: user.LastName,
                Role: user.Role,
                OnboardingComplete: true
            )
        );
    }

    /// <summary>
    /// Simple registration without onboarding (for users who skip onboarding).
    /// POST /api/account/register-simple
    /// </summary>
    [HttpPost("register-simple")]
    public async Task<IActionResult> RegisterSimple([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { error = "Email is required" });
        if (string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { error = "Password is required" });
        if (request.Password.Length < 8)
            return BadRequest(new { error = "Password must be at least 8 characters" });
        if (string.IsNullOrWhiteSpace(request.FirstName))
            return BadRequest(new { error = "First name is required" });
        if (string.IsNullOrWhiteSpace(request.LastName))
            return BadRequest(new { error = "Last name is required" });

        var emailExists = await _db.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower());
        if (emailExists)
        {
            return Conflict(new { error = "An account with this email already exists" });
        }

        var username = request.Username;
        if (string.IsNullOrWhiteSpace(username))
        {
            username = GenerateUsername(request.FirstName, request.LastName);
        }

        var baseUsername = username;
        var counter = 1;
        while (await _db.Users.AnyAsync(u => u.Username == username))
        {
            username = $"{baseUsername}{counter}";
            counter++;
        }

        var user = new User
        {
            Email = request.Email.Trim().ToLower(),
            Password = request.Password,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Username = username,
            Role = "student"
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return CreatedAtAction(
            nameof(RegisterSimple),
            new { id = user.Id },
            new AccountResponse(
                Id: user.Id.ToString(),
                Username: user.Username,
                Email: user.Email,
                FirstName: user.FirstName,
                LastName: user.LastName,
                Role: user.Role,
                OnboardingComplete: false
            )
        );
    }

    private static string GenerateUsername(string firstName, string lastName)
    {
        var first = firstName.Trim().ToLower().Replace(" ", "");
        var last = lastName.Trim().ToLower().Replace(" ", "");
        return $"{first}.{last}";
    }
}
