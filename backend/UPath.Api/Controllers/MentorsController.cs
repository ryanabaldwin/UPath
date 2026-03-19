using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UPath.Api.Data;

namespace UPath.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MentorsController : ControllerBase
{
    private readonly AppDbContext _db;

    public MentorsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var mentors = await _db.Mentors
            .AsNoTracking()
            .OrderBy(m => m.MentorId)
            .Select(m => new
            {
                mentor_id = m.MentorId,
                mentor_first = m.MentorFirst,
                mentor_last = m.MentorLast,
                mentor_region = m.MentorRegion,
                mentor_img_src = m.MentorImgSrc,
                specialty = m.Specialty,
                description = m.Description,
                is_available = true
            })
            .ToListAsync();

        return Ok(mentors);
    }
}

