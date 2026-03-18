using System.ComponentModel.DataAnnotations.Schema;

namespace UPath.Api.Models;

// Composite PK (goalid, user_id) configured in AppDbContext.
[Table("usergoals")]
public class UserGoal
{
    [Column("goalid")]
    public int GoalId { get; set; }

    [Column("user_id")]
    public int UserId { get; set; }

    [Column("progress")]
    public int Progress { get; set; }

    // Navigation
    public Goal Goal { get; set; } = null!;
    public User User { get; set; } = null!;
}
