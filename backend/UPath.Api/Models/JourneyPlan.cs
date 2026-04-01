using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UPath.Api.Models;

[Table("journey_plans")]
public class JourneyPlan
{
    [Key]
    [Column("id")]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    [Column("user_id")]
    public int UserId { get; set; }

    [Column("career_path_key")]
    public string CareerPathKey { get; set; } = string.Empty;

    [Column("plan_start_date")]
    public DateOnly PlanStartDate { get; set; }

    [Column("plan_end_date")]
    public DateOnly PlanEndDate { get; set; }

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }

    public User User { get; set; } = null!;
    public ICollection<Milestone> Milestones { get; set; } = [];
}
