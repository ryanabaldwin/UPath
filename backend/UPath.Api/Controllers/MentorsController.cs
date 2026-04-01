using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UPath.Api.Data;
using UPath.Api.Models;

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
                is_available = !m.Meetings.Any(mt => mt.MeetingStatus == "scheduled")
            })
            .ToListAsync();

        return Ok(mentors);
    }

    [HttpPost("{id:long}/book")]
    public async Task<IActionResult> Book([FromRoute] long id, [FromBody] BookMentorRequest request)
    {
        if (!int.TryParse(request.MenteeId, out var menteeId))
            return BadRequest(new { error = "Invalid mentee_id" });

        var mentor = await _db.Mentors.FindAsync(id);
        if (mentor is null) return NotFound(new { error = "Mentor not found" });

        var alreadyBooked = await _db.Meetings
            .AnyAsync(m => m.MentorId == id && m.MeetingStatus == "scheduled");
        if (alreadyBooked) return Conflict(new { error = "Mentor is already booked" });

        var meeting = new Meeting
        {
            MentorId = id,
            MenteeId = menteeId,
            ScheduledTime = DateTime.UtcNow.AddDays(7),
            MeetingStatus = "scheduled"
        };

        _db.Meetings.Add(meeting);
        await _db.SaveChangesAsync();

        return Ok(new { ok = true });
    }

    [HttpDelete("{id:long}/book")]
    public async Task<IActionResult> Unbook([FromRoute] long id, [FromBody] BookMentorRequest request)
    {
        if (!int.TryParse(request.MenteeId, out var menteeId))
            return BadRequest(new { error = "Invalid mentee_id" });

        var meeting = await _db.Meetings
            .FirstOrDefaultAsync(m => m.MentorId == id && m.MenteeId == menteeId);

        if (meeting is null) return NotFound(new { error = "Booking not found" });

        _db.Meetings.Remove(meeting);
        await _db.SaveChangesAsync();

        return Ok(new { ok = true });
    }
}

public record BookMentorRequest(string MenteeId);
