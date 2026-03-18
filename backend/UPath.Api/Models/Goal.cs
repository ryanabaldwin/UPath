using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UPath.Api.Models;

[Table("goals")]
public class Goal
{
    [Key]
    [Column("goal_id")]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long GoalId { get; set; }

    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [Column("milestone1")]
    public string? Milestone1 { get; set; }

    [Column("milestone2")]
    public string? Milestone2 { get; set; }

    [Column("milestone_n")]
    public string? MilestoneN { get; set; }

    [Column("image1_src")]
    public string? Image1Src { get; set; }

    [Column("image_n_src")]
    public string? ImageNSrc { get; set; }

    // Navigation
    public ICollection<User> Users { get; set; } = [];
    public ICollection<ProgressStatus> ProgressStatuses { get; set; } = [];
}
