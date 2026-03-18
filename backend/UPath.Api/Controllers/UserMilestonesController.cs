using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using UPath.Api.Data;

namespace UPath.Api.Controllers;

[ApiController]
[Route("api/users/{userId:int}/milestones")]
public class UserMilestonesController : ControllerBase
{
    private readonly AppDbContext _db;

    public UserMilestonesController(AppDbContext db) => _db = db;

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

        return Ok(new { tree = roots });
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

