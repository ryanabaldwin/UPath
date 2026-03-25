using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UPath.Api.Models;

[Table("careers")]
public class Career
{
    [Key]
    [Column("career_id")]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int CareerId { get; set; }

    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Column("category")]
    public string Category { get; set; } = string.Empty;

    [Column("average_salary")]
    public int? AverageSalary { get; set; }

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }
}
