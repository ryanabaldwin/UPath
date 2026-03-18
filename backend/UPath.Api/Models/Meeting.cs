using System.ComponentModel.DataAnnotations.Schema;

namespace UPath.Api.Models;

// Composite PK (mentor_id, mentee_id) – one active booking per mentor/mentee pair.
// Configured in AppDbContext.
[Table("meetings")]
public class Meeting
{
    [Column("mentor_id")]
    public long MentorId { get; set; }

    [Column("mentee_id")]
    public int MenteeId { get; set; }

    // Column name is "time" (quoted keyword in PostgreSQL)
    [Column("time")]
    public DateTime ScheduledTime { get; set; }

    [Column("meetingstatus")]
    public string MeetingStatus { get; set; } = string.Empty;

    // Navigation
    public Mentor Mentor { get; set; } = null!;
    public User Mentee { get; set; } = null!;
}
