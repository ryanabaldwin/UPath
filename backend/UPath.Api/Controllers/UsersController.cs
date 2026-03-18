using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UPath.Api.Data;

namespace UPath.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;

    public UsersController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = await _db.Users
            .AsNoTracking()
            .OrderBy(u => u.Id)
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
                north_star_vision = (string?)null,
                definition_of_success = (string?)null,
                current_grade_level = (string?)null,
                streak_count = 0
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById([FromRoute] int id)
    {
        var user = await _db.Users
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
                north_star_vision = (string?)null,
                definition_of_success = (string?)null,
                current_grade_level = (string?)null,
                streak_count = 0
            })
            .FirstOrDefaultAsync();

        if (user is null) return NotFound(new { error = "User not found" });
        return Ok(user);
    }
}

