using System.Text.Json;
using Microsoft.AspNetCore.Hosting;

namespace UPath.Api.Services;

/// <summary>Loads and caches milestone journey templates from JSON (Data/MilestoneJourneys/catalog.json).</summary>
public sealed class MilestoneJourneyTemplateService
{
    private readonly IWebHostEnvironment _env;
    private JourneyCatalogDocument? _catalog;

    public MilestoneJourneyTemplateService(IWebHostEnvironment env) => _env = env;

    public JourneyTemplateDto GetTemplate(string careerPathKey)
    {
        if (string.IsNullOrWhiteSpace(careerPathKey))
            throw new ArgumentException("career_path_key is required", nameof(careerPathKey));

        _catalog ??= LoadCatalog();
        var key = careerPathKey.Trim();
        if (!_catalog.Templates.TryGetValue(key, out var template))
            throw new KeyNotFoundException($"No journey template for career_path_key '{key}'.");

        return template;
    }

    public IReadOnlyCollection<string> GetAvailableKeys()
    {
        _catalog ??= LoadCatalog();
        return _catalog.Templates.Keys.ToList();
    }

    private JourneyCatalogDocument LoadCatalog()
    {
        var path = Path.Combine(_env.ContentRootPath, "Data", "MilestoneJourneys", "catalog.json");
        if (!File.Exists(path))
            throw new FileNotFoundException($"Milestone journey catalog not found at {path}.");

        var json = File.ReadAllText(path);
        var doc = JsonSerializer.Deserialize<JourneyCatalogDocument>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            ReadCommentHandling = JsonCommentHandling.Skip,
            AllowTrailingCommas = true
        });

        if (doc?.Templates is null || doc.Templates.Count == 0)
            throw new InvalidOperationException("Milestone journey catalog is empty or invalid.");

        return doc;
    }
}
