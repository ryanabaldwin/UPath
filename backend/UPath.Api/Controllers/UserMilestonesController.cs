using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.Json.Serialization;
using UPath.Api.Data;
using UPath.Api.Models;
using UPath.Api.Services;

namespace UPath.Api.Controllers;

[ApiController]
[Route("api/users/{userId:int}/milestones")]
public class UserMilestonesController : ControllerBase
{
    private static readonly HashSet<string> ValidTiers = new(StringComparer.Ordinal)
    {
        "macro", "checkpoint", "domain", "daily"
    };

    private static readonly HashSet<string> ValidCategories = new(StringComparer.Ordinal)
    {
        "school", "work", "life", "finance"
    };

    private static readonly HashSet<string> ValidStatuses = new(StringComparer.Ordinal)
    {
        "pending", "in_progress", "complete", "skipped"
    };

    private readonly AppDbContext _db;
    private readonly MilestoneJourneyGeneratorService _journeyGenerator;

    public UserMilestonesController(AppDbContext db, MilestoneJourneyGeneratorService journeyGenerator)
    {
        _db = db;
        _journeyGenerator = journeyGenerator;
    }

    [HttpGet("tree")]
    public async Task<IActionResult> GetTree([FromRoute] int userId)
    {
        var nodes = await _db.Milestones
            .AsNoTracking()
            .Where(m => m.UserId == userId)
            .OrderBy(m => m.Id)
            .Select(m => new MilestoneNodeDto
            {
                Id = (int)m.Id,
                UserId = m.UserId.ToString(),
                ParentId = m.ParentId == null ? null : (int?)m.ParentId.Value,
                Title = m.Title,
                Description = m.Description,
                Tier = m.Tier,
                Category = m.Category,
                Status = m.Status,
                DueDate = m.DueDate == null ? null : m.DueDate.Value.ToString("yyyy-MM-dd"),
                CreatedAt = m.CreatedAt.ToString("O"),
                UpdatedAt = m.UpdatedAt.ToString("O"),
                Children = new List<MilestoneNodeDto>()
            })
            .ToListAsync();

        var byId = nodes.ToDictionary(n => n.Id);
        var roots = new List<MilestoneNodeDto>();

        foreach (var node in nodes)
        {
            if (node.ParentId is int parentId && byId.TryGetValue(parentId, out var parent))
            {
                parent.Children.Add(node);
            }
            else
            {
                roots.Add(node);
            }
        }

        var flatForSummary = await _db.Milestones
            .AsNoTracking()
            .Where(m => m.UserId == userId)
            .Select(m => new MilestoneTreeSummaryCalculator.FlatNode(
                m.Id,
                m.ParentId,
                m.Tier,
                m.Status,
                m.DueDate == null ? null : m.DueDate.Value.ToString("yyyy-MM-dd"),
                m.Title))
            .ToListAsync();

        var summary = MilestoneTreeSummaryCalculator.Compute(flatForSummary, DateOnly.FromDateTime(DateTime.UtcNow));

        var hasActiveGeneratedPlan = await _db.JourneyPlans
            .AsNoTracking()
            .AnyAsync(j => j.UserId == userId);

        return Ok(new { tree = roots, summary, has_active_generated_plan = hasActiveGeneratedPlan });
    }

    /// <summary>Generate a 5-year milestone journey from JSON templates (replaces any prior generated plan).</summary>
    [HttpPost("generate")]
    public async Task<IActionResult> GenerateJourney([FromRoute] int userId, [FromBody] GenerateJourneyRequest? body)
    {
        if (!IsSessionUser(userId))
            return Forbid();

        if (body is null)
            return BadRequest(new { error = "body is required" });

        string? pathKey = string.IsNullOrWhiteSpace(body.CareerPathKey) ? null : body.CareerPathKey.Trim();

        if (body.CareerId is int cid)
        {
            var career = await _db.Careers.AsNoTracking().FirstOrDefaultAsync(c => c.CareerId == cid);
            if (career is null)
                return NotFound(new { error = "Career not found" });
            pathKey = career.CareerPathKey;
        }

        if (string.IsNullOrEmpty(pathKey))
            return BadRequest(new { error = "career_id or career_path_key is required" });

        try
        {
            var result = await _journeyGenerator.GenerateAsync(userId, pathKey);
            return Ok(new
            {
                journey_plan_id = result.JourneyPlanId,
                northstar_milestone_id = result.NorthstarMilestoneId,
                generated_count = result.CreatedCount,
                plan_end_date = result.PlanEndDate.ToString("yyyy-MM-dd"),
                career_path_key = pathKey
            });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromRoute] int userId, [FromBody] CreateMilestoneRequest? body)
    {
        if (body is null)
            return BadRequest(new { error = "body is required" });

        if (!await _db.Users.AnyAsync(u => u.Id == userId))
            return NotFound(new { error = "User not found" });

        var title = (body.Title ?? "").Trim();
        if (title.Length == 0)
            return BadRequest(new { error = "title is required" });
        if (title.Length > 255)
            title = title[..255];

        var tier = (body.Tier ?? "").Trim();
        if (!ValidTiers.Contains(tier))
            return BadRequest(new { error = "tier must be one of: macro, checkpoint, domain, daily" });

        long? parentId = null;
        if (body.ParentId is int pid)
        {
            var parent = await _db.Milestones.AsNoTracking()
                .FirstOrDefaultAsync(m => m.Id == pid && m.UserId == userId);
            if (parent is null)
                return BadRequest(new { error = "parent_id not found for this user" });
            parentId = parent.Id;
        }

        var description = NormalizeDescription(body.Description);
        var category = NormalizeCategory(body.Category);
        var status = NormalizeStatus(body.Status) ?? "pending";

        DateOnly? dueDate = null;
        if (body.DueDate is { } ds && !string.IsNullOrWhiteSpace(ds))
        {
            if (!DateOnly.TryParse(ds.Trim(), out var parsed))
                return BadRequest(new { error = "invalid due_date" });
            dueDate = parsed;
        }

        var now = DateTimeOffset.UtcNow;
        var entity = new Milestone
        {
            UserId = userId,
            ParentId = parentId,
            Title = title,
            Description = description,
            Tier = tier,
            Category = category,
            Status = status,
            DueDate = dueDate,
            CreatedAt = now,
            UpdatedAt = now
        };

        _db.Milestones.Add(entity);

        var userForCount = await _db.Users.FirstAsync(u => u.Id == userId);
        var completeInDb = await _db.Milestones.AsNoTracking()
            .CountAsync(m => m.UserId == userId && m.Status == "complete");
        userForCount.StreakCount = completeInDb + (entity.Status == "complete" ? 1 : 0);

        await _db.SaveChangesAsync();

        return StatusCode(201, ToFlatDto(entity));
    }

    [HttpPatch("{milestoneId:long}")]
    public async Task<IActionResult> Patch([FromRoute] int userId, [FromRoute] long milestoneId, [FromBody] JsonElement body)
    {
        if (body.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null)
            return BadRequest(new { error = "body is required" });

        var milestone = await _db.Milestones.FirstOrDefaultAsync(m => m.Id == milestoneId && m.UserId == userId);
        if (milestone is null)
            return NotFound(new { error = "Milestone not found" });

        var changed = false;

        if (body.TryGetProperty("title", out var titleProp))
        {
            if (titleProp.ValueKind == JsonValueKind.Null)
                return BadRequest(new { error = "title cannot be null" });
            if (titleProp.ValueKind != JsonValueKind.String)
                return BadRequest(new { error = "invalid title" });
            var t = titleProp.GetString()?.Trim() ?? "";
            if (t.Length == 0)
                return BadRequest(new { error = "title cannot be empty" });
            if (t.Length > 255)
                t = t[..255];
            milestone.Title = t;
            changed = true;
        }

        if (body.TryGetProperty("description", out var descProp))
        {
            if (descProp.ValueKind == JsonValueKind.Null)
                milestone.Description = null;
            else if (descProp.ValueKind == JsonValueKind.String)
                milestone.Description = NormalizeDescription(descProp.GetString());
            else
                return BadRequest(new { error = "invalid description" });
            changed = true;
        }

        if (body.TryGetProperty("status", out var stProp))
        {
            if (stProp.ValueKind == JsonValueKind.Null)
                return BadRequest(new { error = "status cannot be null" });
            if (stProp.ValueKind != JsonValueKind.String)
                return BadRequest(new { error = "invalid status" });
            var s = stProp.GetString()?.Trim();
            if (s is null || !ValidStatuses.Contains(s))
                return BadRequest(new { error = "invalid status" });
            milestone.Status = s;
            changed = true;
        }

        if (body.TryGetProperty("category", out var catProp))
        {
            if (catProp.ValueKind == JsonValueKind.Null)
                milestone.Category = null;
            else if (catProp.ValueKind == JsonValueKind.String)
                milestone.Category = NormalizeCategory(catProp.GetString());
            else
                return BadRequest(new { error = "invalid category" });
            changed = true;
        }

        if (body.TryGetProperty("due_date", out var dueProp))
        {
            if (dueProp.ValueKind == JsonValueKind.Null)
                milestone.DueDate = null;
            else if (dueProp.ValueKind == JsonValueKind.String)
            {
                var ds = dueProp.GetString();
                if (string.IsNullOrWhiteSpace(ds))
                    milestone.DueDate = null;
                else if (DateOnly.TryParse(ds.Trim(), out var dd))
                    milestone.DueDate = dd;
                else
                    return BadRequest(new { error = "invalid due_date" });
            }
            else
                return BadRequest(new { error = "invalid due_date" });
            changed = true;
        }

        if (!changed)
            return BadRequest(new { error = "no valid fields to update" });

        milestone.UpdatedAt = DateTimeOffset.UtcNow;

        var statusWasPatched = body.TryGetProperty("status", out _);
        if (statusWasPatched)
        {
            var user = await _db.Users.FirstAsync(u => u.Id == userId);
            var othersComplete = await _db.Milestones.AsNoTracking()
                .CountAsync(m => m.UserId == userId && m.Id != milestone.Id && m.Status == "complete");
            user.StreakCount = othersComplete + (milestone.Status == "complete" ? 1 : 0);
        }

        await _db.SaveChangesAsync();

        return Ok(ToFlatDto(milestone));
    }

    [HttpDelete("{milestoneId:long}")]
    public async Task<IActionResult> Delete([FromRoute] int userId, [FromRoute] long milestoneId)
    {
        var milestone = await _db.Milestones.FirstOrDefaultAsync(m => m.Id == milestoneId && m.UserId == userId);
        if (milestone is null)
            return NotFound(new { error = "Milestone not found" });

        var deletedId = milestone.Id;
        _db.Milestones.Remove(milestone);

        var userForCount = await _db.Users.FirstAsync(u => u.Id == userId);
        userForCount.StreakCount = await _db.Milestones.AsNoTracking()
            .CountAsync(m => m.UserId == userId && m.Id != deletedId && m.Status == "complete");

        await _db.SaveChangesAsync();

        return Ok(new { ok = true });
    }

    private bool IsSessionUser(int userId)
    {
        var sessionId = HttpContext.Session.GetString("UserId");
        return int.TryParse(sessionId, out var sid) && sid == userId;
    }

    private static MilestoneNodeDto ToFlatDto(Milestone m) => new()
    {
        Id = (int)m.Id,
        UserId = m.UserId.ToString(),
        ParentId = m.ParentId == null ? null : (int?)m.ParentId.Value,
        Title = m.Title,
        Description = m.Description,
        Tier = m.Tier,
        Category = m.Category,
        Status = m.Status,
        DueDate = m.DueDate == null ? null : m.DueDate.Value.ToString("yyyy-MM-dd"),
        CreatedAt = m.CreatedAt.ToString("O"),
        UpdatedAt = m.UpdatedAt.ToString("O"),
        Children = new List<MilestoneNodeDto>()
    };

    private static string? NormalizeDescription(string? raw)
    {
        if (raw is null) return null;
        var t = raw.Trim();
        if (t.Length == 0) return null;
        return t.Length > 1000 ? t[..1000] : t;
    }

    private static string? NormalizeCategory(string? raw)
    {
        if (raw is null) return null;
        var c = raw.Trim();
        return ValidCategories.Contains(c) ? c : null;
    }

    private static string? NormalizeStatus(string? raw)
    {
        if (raw is null) return null;
        var s = raw.Trim();
        return ValidStatuses.Contains(s) ? s : null;
    }

    public sealed class GenerateJourneyRequest
    {
        [JsonPropertyName("career_id")]
        public int? CareerId { get; set; }

        [JsonPropertyName("career_path_key")]
        public string? CareerPathKey { get; set; }
    }

    public sealed class CreateMilestoneRequest
    {
        [JsonPropertyName("title")]
        public string? Title { get; set; }

        [JsonPropertyName("tier")]
        public string? Tier { get; set; }

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("category")]
        public string? Category { get; set; }

        [JsonPropertyName("status")]
        public string? Status { get; set; }

        [JsonPropertyName("due_date")]
        public string? DueDate { get; set; }

        [JsonPropertyName("parent_id")]
        public int? ParentId { get; set; }
    }

    private sealed class MilestoneNodeDto
    {
        [JsonPropertyName("id")]
        public required int Id { get; init; }

        [JsonPropertyName("user_id")]
        public required string UserId { get; init; }

        [JsonPropertyName("parent_id")]
        public required int? ParentId { get; init; }

        [JsonPropertyName("title")]
        public required string Title { get; init; }

        [JsonPropertyName("description")]
        public required string? Description { get; init; }

        [JsonPropertyName("tier")]
        public required string Tier { get; init; }

        [JsonPropertyName("category")]
        public required string? Category { get; init; }

        [JsonPropertyName("status")]
        public required string Status { get; init; }

        [JsonPropertyName("due_date")]
        public required string? DueDate { get; init; }

        [JsonPropertyName("created_at")]
        public required string CreatedAt { get; init; }

        [JsonPropertyName("updated_at")]
        public required string UpdatedAt { get; init; }

        [JsonPropertyName("children")]
        public required List<MilestoneNodeDto> Children { get; init; }
    }
}
