using System.Text.Json.Serialization;

namespace UPath.Api.Services;

public sealed class JourneyCatalogDocument
{
    [JsonPropertyName("templates")]
    public Dictionary<string, JourneyTemplateDto> Templates { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}

public sealed class JourneyTemplateDto
{
    [JsonPropertyName("careerPathKey")]
    public string CareerPathKey { get; set; } = "";

    [JsonPropertyName("northstar")]
    public NorthstarTemplateDto Northstar { get; set; } = new();

    [JsonPropertyName("years")]
    public List<YearTemplateDto> Years { get; set; } = [];
}

public sealed class NorthstarTemplateDto
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = "";

    [JsonPropertyName("description")]
    public string? Description { get; set; }
}

public sealed class YearTemplateDto
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = "";

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("quarters")]
    public List<QuarterTemplateDto> Quarters { get; set; } = [];
}

public sealed class QuarterTemplateDto
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = "";

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("months")]
    public List<MonthTemplateDto> Months { get; set; } = [];
}

public sealed class MonthTemplateDto
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = "";

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    /// <summary>Optional: school | work | life | finance</summary>
    [JsonPropertyName("category")]
    public string? Category { get; set; }
}
