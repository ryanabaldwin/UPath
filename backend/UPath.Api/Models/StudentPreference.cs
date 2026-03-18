using System.ComponentModel.DataAnnotations.Schema;

namespace UPath.Api.Models;

// PK is user_id (1-to-1 with users). Configured in AppDbContext.
[Table("student_preferences")]
public class StudentPreference
{
    [Column("user_id")]
    public int UserId { get; set; }

    // Free-text interests string
    [Column("interests")]
    public string? Interests { get; set; }

    // Stored as JSONB; deserialize to string[] as needed in the controller/service layer
    [Column("selected_career_paths", TypeName = "jsonb")]
    public string SelectedCareerPaths { get; set; } = "[]";

    [Column("updated_at")]
    public DateTimeOffset UpdatedAt { get; set; }

    // Navigation
    public User User { get; set; } = null!;
}
