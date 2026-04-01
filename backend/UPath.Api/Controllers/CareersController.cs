using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UPath.Api.Data;

namespace UPath.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CareersController : ControllerBase
{
    private readonly AppDbContext _db;

    public CareersController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? category)
    {
        var query = _db.Careers.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(c => c.Category == category);

        var careers = await query
            .OrderBy(c => c.CareerId)
            .Select(c => new
            {
                career_id = c.CareerId,
                title = c.Title,
                description = c.Description,
                category = c.Category,
                career_path_key = c.CareerPathKey,
                average_salary = c.AverageSalary
            })
            .ToListAsync();

        return Ok(careers);
    }
}
