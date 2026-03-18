using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UPath.Api.Models;

[Table("sponsor")]
public class Sponsor
{
    [Key]
    [Column("sponsor_id")]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long SponsorId { get; set; }

    [Column("sponsor_name")]
    public string SponsorName { get; set; } = string.Empty;

    [Column("sponsor_type")]
    public string? SponsorType { get; set; }

    [Column("sponsor_image_src")]
    public string? SponsorImageSrc { get; set; }
}
