using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UPath.Api.Data;
using UPath.Api.Models;

namespace UPath.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;

    public UsersController(AppDbContext db) => _db = db;

    /// <summary>
    /// List all users. Restricted to admin role.
    /// GET /api/users
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var role = HttpContext.Session.GetString("UserRole");
        if (role != "admin")
        {
            return StatusCode(403, new { error = "Admin access required" });
        }

        var users = await _db.Users
            .AsNoTracking()
            .OrderBy(u => u.Id)
            .Select(u => new
            {
                id = u.Id.ToString(),
                user_first = u.FirstName,
                user_last = u.LastName,
                user_region = u.Region,
                email = u.Email,
                username = u.Username,
                role = u.Role,
                goal_id = u.UserGoals
                    .OrderByDescending(ug => ug.GoalId)
                    .Select(ug => (int?)ug.GoalId)
                    .FirstOrDefault(),
                user_img_src = (string?)null,
                goal_title = u.UserGoals
                    .OrderByDescending(ug => ug.GoalId)
                    .Select(ug => ug.Goal.Pi1)
                    .FirstOrDefault(),
                north_star_vision = u.NorthStarVision,
                definition_of_success = u.DefinitionOfSuccess,
                current_grade_level = u.CurrentGradeLevel,
                streak_count = u.StreakCount
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById([FromRoute] int id)
    {
        var user = await UserPublicProjectionSingleAsync(id);
        if (user is null) return NotFound(new { error = "User not found" });
        return Ok(user);
    }

    /// <summary>
    /// GET /api/users/{id}/meetings
    /// </summary>
    [HttpGet("{id:int}/meetings")]
    public async Task<IActionResult> GetUserMeetings([FromRoute] int id)
    {
        if (!IsPreferencesOwner(id))
            return Forbid();

        var meetings = await _db.Meetings
            .AsNoTracking()
            .Where(m => m.MenteeId == id)
            .OrderBy(m => m.ScheduledTime)
            .Select(m => new
            {
                mentor_id = m.MentorId,
                mentee_id = m.MenteeId.ToString(),
                time = m.ScheduledTime,
                meetingstatus = m.MeetingStatus,
                mentor_first = m.Mentor.MentorFirst,
                mentor_last = m.Mentor.MentorLast,
                specialty = m.Mentor.Specialty
            })
            .ToListAsync();

        return Ok(meetings);
    }

    /// <summary>
    /// PATCH /api/users/{id} — partial update (snake_case keys from frontend). Session user must match id.
    /// </summary>
    [HttpPatch("{id:int}")]
    public async Task<IActionResult> PatchUser([FromRoute] int id, [FromBody] JsonElement body)
    {
        if (!IsPreferencesOwner(id))
            return Forbid();

        var entity = await _db.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (entity is null)
            return NotFound(new { error = "User not found" });

        if (body.TryGetProperty("user_first", out var fn) && fn.ValueKind == JsonValueKind.String)
        {
            var s = fn.GetString();
            if (!string.IsNullOrWhiteSpace(s))
                entity.FirstName = s;
        }

        if (body.TryGetProperty("user_last", out var ln) && ln.ValueKind == JsonValueKind.String)
        {
            var s = ln.GetString();
            if (!string.IsNullOrWhiteSpace(s))
                entity.LastName = s;
        }

        if (body.TryGetProperty("user_region", out var reg))
            entity.Region = ReadNullableString(reg);

        if (body.TryGetProperty("north_star_vision", out var ns))
            entity.NorthStarVision = ReadNullableString(ns);

        if (body.TryGetProperty("definition_of_success", out var def))
            entity.DefinitionOfSuccess = ReadNullableString(def);

        if (body.TryGetProperty("current_grade_level", out var gr))
            entity.CurrentGradeLevel = ReadNullableString(gr);

        // user_img_src: no column on User entity; ignore if sent.

        await _db.SaveChangesAsync();

        var projected = await UserPublicProjectionSingleAsync(id);
        return projected is null ? NotFound(new { error = "User not found" }) : Ok(projected);
    }

    /// <summary>
    /// GET /api/users/{id}/preferences
    /// </summary>
    [HttpGet("{id:int}/preferences")]
    public async Task<IActionResult> GetPreferences([FromRoute] int id)
    {
        if (!IsPreferencesOwner(id))
            return Forbid();

        var pref = await _db.StudentPreferences.AsNoTracking().FirstOrDefaultAsync(sp => sp.UserId == id);
        if (pref is null)
            return Ok(PreferencesResponse(id, null, [], null));

        var paths = DeserializeCareerPaths(pref.SelectedCareerPaths);
        return Ok(PreferencesResponse(id, pref.Interests, paths, pref.UpdatedAt.ToString("O")));
    }

    /// <summary>
    /// PUT /api/users/{id}/preferences — upsert with partial update (only JSON properties that are sent are applied).
    /// </summary>
    [HttpPut("{id:int}/preferences")]
    public async Task<IActionResult> PutPreferences([FromRoute] int id, [FromBody] JsonElement body)
    {
        if (!IsPreferencesOwner(id))
            return Forbid();

        var updateInterests = body.TryGetProperty("interests", out var interestsEl);
        string? newInterests = null;
        if (updateInterests)
        {
            newInterests = interestsEl.ValueKind switch
            {
                JsonValueKind.Null => null,
                JsonValueKind.String => interestsEl.GetString(),
                _ => interestsEl.ToString()
            };
        }

        var updatePaths = body.TryGetProperty("selected_career_paths", out var pathsEl)
            || body.TryGetProperty("selectedCareerPaths", out pathsEl);
        string[]? newPaths = null;
        if (updatePaths)
        {
            newPaths = pathsEl.ValueKind switch
            {
                JsonValueKind.Null => [],
                _ => JsonSerializer.Deserialize<string[]>(pathsEl.GetRawText()) ?? []
            };
        }

        if (!updateInterests && !updatePaths)
            return BadRequest(new { error = "Provide interests and/or selectedCareerPaths" });

        var existing = await _db.StudentPreferences.FirstOrDefaultAsync(sp => sp.UserId == id);
        if (existing is null)
        {
            existing = new StudentPreference
            {
                UserId = id,
                Interests = updateInterests ? newInterests : null,
                SelectedCareerPaths = updatePaths
                    ? JsonSerializer.Serialize(newPaths ?? [])
                    : "[]",
                UpdatedAt = DateTimeOffset.UtcNow
            };
            _db.StudentPreferences.Add(existing);
        }
        else
        {
            if (updateInterests)
                existing.Interests = newInterests;
            if (updatePaths)
                existing.SelectedCareerPaths = JsonSerializer.Serialize(newPaths ?? []);
            existing.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await _db.SaveChangesAsync();
        return await GetPreferences(id);
    }

    private bool IsPreferencesOwner(int userId)
    {
        var sessionId = HttpContext.Session.GetString("UserId");
        return int.TryParse(sessionId, out var sid) && sid == userId;
    }

    private async Task<object?> UserPublicProjectionSingleAsync(int id) =>
        await _db.Users
            .AsNoTracking()
            .Where(u => u.Id == id)
            .Select(u => new
            {
                id = u.Id.ToString(),
                user_first = u.FirstName,
                user_last = u.LastName,
                user_region = u.Region,
                goal_id = u.UserGoals
                    .OrderByDescending(ug => ug.GoalId)
                    .Select(ug => (int?)ug.GoalId)
                    .FirstOrDefault(),
                user_img_src = (string?)null,
                goal_title = u.UserGoals
                    .OrderByDescending(ug => ug.GoalId)
                    .Select(ug => ug.Goal.Pi1)
                    .FirstOrDefault(),
                north_star_vision = u.NorthStarVision,
                definition_of_success = u.DefinitionOfSuccess,
                current_grade_level = u.CurrentGradeLevel,
                streak_count = u.StreakCount
            })
            .FirstOrDefaultAsync();

    private static string? ReadNullableString(JsonElement el) =>
        el.ValueKind switch
        {
            JsonValueKind.Null => null,
            JsonValueKind.String => el.GetString(),
            _ => el.ToString()
        };

    /// <summary>JSON keys match <c>StudentPreferences</c> in the frontend (snake_case).</summary>
    private static Dictionary<string, object?> PreferencesResponse(int id, string? interests, string[] paths, string? updatedAtIso) =>
        new()
        {
            ["user_id"] = id.ToString(),
            ["interests"] = interests,
            ["selected_career_paths"] = paths,
            ["updated_at"] = updatedAtIso
        };

    private static string[] DeserializeCareerPaths(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<string[]>(json) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }
}
