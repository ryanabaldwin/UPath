using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UPath.Api.Models;

[Table("goals")]
public class Goal
{
    [Key]
    [Column("goalid")]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int GoalId { get; set; }

    [Column("pi1")]
    public string Pi1 { get; set; } = string.Empty;

    [Column("pi2")]
    public string Pi2 { get; set; } = string.Empty;

    [Column("pi3")]
    public string? Pi3 { get; set; }

    [Column("pi4")]
    public string? Pi4 { get; set; }

    [Column("pi5")]
    public string? Pi5 { get; set; }

    [Column("pi6")]
    public string? Pi6 { get; set; }

    [Column("pi7")]
    public string? Pi7 { get; set; }

    [Column("pi8")]
    public string? Pi8 { get; set; }

    [Column("pi9")]
    public string? Pi9 { get; set; }

    [Column("pi10")]
    public string? Pi10 { get; set; }

    // Navigation
    public ICollection<UserGoal> UserGoals { get; set; } = [];
}
