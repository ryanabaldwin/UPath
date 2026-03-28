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
                north_star_vision = u.NorthStarVision,
                definition_of_success = u.DefinitionOfSuccess,
                current_grade_level = u.CurrentGradeLevel,
                streak_count = u.StreakCount
            })
            .FirstOrDefaultAsync();

        if (user is null) return NotFound(new { error = "User not found" });
        return Ok(user);
    }
}
