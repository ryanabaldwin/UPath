using System.ComponentModel.DataAnnotations.Schema;

namespace UPath.Api.Models;

// Composite PK (user_id, resource_id). Configured in AppDbContext.
[Table("resource_bookmarks")]
public class ResourceBookmark
{
    [Column("user_id")]
    public Guid UserId { get; set; }

    [Column("resource_id")]
    public long ResourceId { get; set; }

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }

    // Navigation
    public User User { get; set; } = null!;
    public Resource Resource { get; set; } = null!;
}
