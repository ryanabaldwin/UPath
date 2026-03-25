using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UPath.Api.Data;

namespace UPath.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ResourcesController : ControllerBase
{
    private readonly AppDbContext _db;

    public ResourcesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? category)
    {
        var query = _db.Resources.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(r => r.Category == category);

        var resources = await query
            .OrderBy(r => r.ResourceId)
            .Select(r => new
            {
                resource_id = r.ResourceId,
                title = r.Title,
                description = r.Description,
                category = r.Category,
                link = r.Link,
                industry = r.Industry,
                education_level = r.EducationLevel,
                format = r.Format,
                location = r.Location,
                deadline_date = r.DeadlineDate,
                cost_usd = r.CostUsd,
                eligibility_notes = r.EligibilityNotes
            })
            .ToListAsync();

        return Ok(resources);
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search(
        [FromQuery] string? industry,
        [FromQuery] string? education_level,
        [FromQuery] string? format,
        [FromQuery] string? location)
    {
        var query = _db.Resources.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(industry))
            query = query.Where(r => r.Industry == industry);
        if (!string.IsNullOrWhiteSpace(education_level))
            query = query.Where(r => r.EducationLevel == education_level);
        if (!string.IsNullOrWhiteSpace(format))
            query = query.Where(r => r.Format == format);
        if (!string.IsNullOrWhiteSpace(location))
            query = query.Where(r => r.Location == location);

        var resources = await query
            .OrderBy(r => r.ResourceId)
            .Select(r => new
            {
                resource_id = r.ResourceId,
                title = r.Title,
                description = r.Description,
                category = r.Category,
                link = r.Link,
                industry = r.Industry,
                education_level = r.EducationLevel,
                format = r.Format,
                location = r.Location,
                deadline_date = r.DeadlineDate,
                cost_usd = r.CostUsd,
                eligibility_notes = r.EligibilityNotes
            })
            .ToListAsync();

        return Ok(resources);
    }
}
