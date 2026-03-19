using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UPath.Api.Data;

namespace UPath.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GoalsController : ControllerBase
{
    private readonly AppDbContext _db;

    public GoalsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var goals = await _db.Goals
            .AsNoTracking()
            .OrderBy(g => g.GoalId)
            .Select(g => new
            {
                goal_id = g.GoalId.ToString(),
                title = g.Pi1,
                milestone1 = g.Pi2,
                milestone2 = g.Pi3,
                milestone_n = g.Pi4,
                image1_src = (string?)null,
                image_n_src = (string?)null
            })
            .ToListAsync();

        return Ok(goals);
    }
}

