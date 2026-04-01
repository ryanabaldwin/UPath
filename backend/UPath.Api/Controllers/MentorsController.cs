using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
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
        var scheduledMentorIds = await _db.Meetings
            .AsNoTracking()
            .Where(m => m.MeetingStatus == "scheduled")
            .Select(m => m.MentorId)
            .Distinct()
            .ToListAsync();

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
                is_available = !scheduledMentorIds.Contains(m.MentorId)
            })
            .ToListAsync();

        return Ok(mentors);
    }

    [HttpPost("{mentorId:long}/book")]
    public async Task<IActionResult> BookMentor([FromRoute] long mentorId, [FromBody] BookMentorRequest? body)
    {
        if (!TryGetSessionUserId(out var sessionUserId))
            return Unauthorized(new { error = "Authentication required" });

        if (!string.IsNullOrWhiteSpace(body?.MenteeId) && body!.MenteeId != sessionUserId.ToString())
            return Forbid();

        var mentorExists = await _db.Mentors.AnyAsync(m => m.MentorId == mentorId);
        if (!mentorExists)
            return NotFound(new { error = "Mentor not found" });

        var mentorBookedByAnotherUser = await _db.Meetings
            .AsNoTracking()
            .AnyAsync(m => m.MentorId == mentorId
                && m.MeetingStatus == "scheduled"
                && m.MenteeId != sessionUserId);

        if (mentorBookedByAnotherUser)
            return Conflict(new { error = "Mentor is already booked" });

        var existingMeeting = await _db.Meetings
            .FirstOrDefaultAsync(m => m.MentorId == mentorId && m.MenteeId == sessionUserId);

        if (existingMeeting is null)
        {
            _db.Meetings.Add(new Models.Meeting
            {
                MentorId = mentorId,
                MenteeId = sessionUserId,
                ScheduledTime = DateTime.UtcNow.AddDays(1),
                MeetingStatus = "scheduled"
            });
        }
        else
        {
            existingMeeting.ScheduledTime = DateTime.UtcNow.AddDays(1);
            existingMeeting.MeetingStatus = "scheduled";
        }

        await _db.SaveChangesAsync();
        return Ok(new { ok = true });
    }

    [HttpDelete("{mentorId:long}/book")]
    public async Task<IActionResult> UnbookMentor([FromRoute] long mentorId)
    {
        if (!TryGetSessionUserId(out var sessionUserId))
            return Unauthorized(new { error = "Authentication required" });

        var meeting = await _db.Meetings
            .FirstOrDefaultAsync(m => m.MentorId == mentorId
                && m.MenteeId == sessionUserId
                && m.MeetingStatus == "scheduled");

        if (meeting is null)
            return NotFound(new { error = "Booking not found" });

        _db.Meetings.Remove(meeting);
        await _db.SaveChangesAsync();

        return Ok(new { ok = true });
    }

    private bool TryGetSessionUserId(out int userId)
    {
        var sessionValue = HttpContext.Session.GetString("UserId");
        return int.TryParse(sessionValue, out userId);
    }

    public sealed class BookMentorRequest
    {
        [JsonPropertyName("mentee_id")]
        public string? MenteeId { get; set; }
    }
}

