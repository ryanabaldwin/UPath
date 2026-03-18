using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UPath.Api.Models;

[Table("resources")]
public class Resource
{
    [Key]
    [Column("resource_id")]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long ResourceId { get; set; }

    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Column("category")]
    public string Category { get; set; } = string.Empty;

    [Column("link")]
    public string? Link { get; set; }

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }

    // Added by migration 005
    [Column("industry")]
    public string? Industry { get; set; }

    [Column("education_level")]
    public string? EducationLevel { get; set; }

    [Column("format")]
    public string? Format { get; set; }

    [Column("location")]
    public string? Location { get; set; }

    [Column("deadline_date")]
    public DateOnly? DeadlineDate { get; set; }

    [Column("cost_usd")]
    public int? CostUsd { get; set; }

    [Column("eligibility_notes")]
    public string? EligibilityNotes { get; set; }

    // Navigation
    public ICollection<ResourceBookmark> ResourceBookmarks { get; set; } = [];
}
