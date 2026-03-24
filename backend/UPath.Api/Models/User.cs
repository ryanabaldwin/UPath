using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UPath.Api.Models;

[Table("users")]
public class User
{
    [Key]
    [Column("id")]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Column("username")]
    public string Username { get; set; } = string.Empty;

    [Column("password")]
    public string Password { get; set; } = string.Empty;

    [Column("role")]
    public string Role { get; set; } = string.Empty;

    [Column("region")]
    public string? Region { get; set; }

    [Column("ethnicity")]
    public string? Ethnicity { get; set; }

    [Column("incomebracket")]
    public int? IncomeBracket { get; set; }

    [Column("first_name")]
    public string FirstName { get; set; } = string.Empty;

    [Column("last_name")]
    public string LastName { get; set; } = string.Empty;

    [Column("email")]
    public string Email { get; set; } = string.Empty;

    [Column("date_of_birth")]
    public DateOnly? DateOfBirth { get; set; }

    [Column("north_star_vision")]
    public string? NorthStarVision { get; set; }

    [Column("definition_of_success")]
    public string? DefinitionOfSuccess { get; set; }

    [Column("current_grade_level")]
    public string? CurrentGradeLevel { get; set; }

    [Column("streak_count")]
    public int StreakCount { get; set; }

    // Navigation
    public ICollection<UserGoal> UserGoals { get; set; } = [];
    public StudentPreference? StudentPreference { get; set; }
    public ICollection<Meeting> MenteeMeetings { get; set; } = [];
    public ICollection<ResourceBookmark> ResourceBookmarks { get; set; } = [];
    public ICollection<Milestone> Milestones { get; set; } = [];
}
