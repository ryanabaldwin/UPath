using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UPath.Api.Data;

namespace UPath.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly AppDbContext _db;

    public HealthController(AppDbContext db) => _db = db;

    /// <summary>
    /// Returns API status and database connectivity.
    /// GET /api/health
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var dbReachable = await _db.Database.CanConnectAsync();

        return Ok(new
        {
            status = "ok",
            database = dbReachable ? "connected" : "unreachable",
            timestamp = DateTimeOffset.UtcNow
        });
    }
}
