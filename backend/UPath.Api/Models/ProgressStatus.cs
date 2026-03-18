using System.ComponentModel.DataAnnotations.Schema;

namespace UPath.Api.Models;

// Composite PK (id, goal_id) configured in AppDbContext.
// Note: the "id" column is a FK to users.id (UUID), not a standalone identifier.
[Table("progressstatus")]
public class ProgressStatus
{
    // Maps to the "id" column, which is a FK to users.id
    [Column("id")]
    public Guid UserId { get; set; }

    [Column("goal_id")]
    public long GoalId { get; set; }

    [Column("milestone1_is_complete")]
    public bool Milestone1IsComplete { get; set; }

    [Column("milestone2_is_complete")]
    public bool Milestone2IsComplete { get; set; }

    [Column("milestone_n_is_complete")]
    public bool MilestoneNIsComplete { get; set; }

    // Navigation
    public User User { get; set; } = null!;
    public Goal Goal { get; set; } = null!;
}
