using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UPath.Api.Models;

[Table("mentors")]
public class Mentor
{
    [Key]
    [Column("mentor_id")]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long MentorId { get; set; }

    [Column("mentor_first")]
    public string MentorFirst { get; set; } = string.Empty;

    [Column("mentor_last")]
    public string MentorLast { get; set; } = string.Empty;

    [Column("mentor_region")]
    public string? MentorRegion { get; set; }

    [Column("mentor_img_src")]
    public string? MentorImgSrc { get; set; }

    [Column("specialty")]
    public string? Specialty { get; set; }

    [Column("description")]
    public string? Description { get; set; }

    // Navigation
    public ICollection<Meeting> Meetings { get; set; } = [];
}
