using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UPath.Api.Models;

// tier:     macro | checkpoint | domain | daily
// category: school | work | life | finance
// status:   pending | in_progress | complete | skipped
[Table("milestones")]
public class Milestone
{
    [Key]
    [Column("id")]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    [Column("user_id")]
    public int UserId { get; set; }

    [Column("parent_id")]
    public long? ParentId { get; set; }

    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Column("tier")]
    public string Tier { get; set; } = string.Empty;

    [Column("category")]
    public string? Category { get; set; }

    [Column("status")]
    public string Status { get; set; } = "pending";

    [Column("due_date")]
    public DateOnly? DueDate { get; set; }

    [Column("journey_plan_id")]
    public long? JourneyPlanId { get; set; }

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTimeOffset UpdatedAt { get; set; }

    // Navigation
    public User User { get; set; } = null!;
    public Milestone? Parent { get; set; }
    public ICollection<Milestone> Children { get; set; } = [];

    public JourneyPlan? JourneyPlan { get; set; }
}
