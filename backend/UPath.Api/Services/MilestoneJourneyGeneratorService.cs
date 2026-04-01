using Microsoft.EntityFrameworkCore;
using UPath.Api.Data;
using UPath.Api.Models;

namespace UPath.Api.Services;

public sealed class MilestoneJourneyGeneratorService
{
    private static readonly HashSet<string> ValidCategories = new(StringComparer.Ordinal)
    {
        "school", "work", "life", "finance"
    };

    private readonly AppDbContext _db;
    private readonly MilestoneJourneyTemplateService _templates;

    public MilestoneJourneyGeneratorService(AppDbContext db, MilestoneJourneyTemplateService templates)
    {
        _db = db;
        _templates = templates;
    }

    /// <summary>Deletes existing generated plans for the user and inserts a new journey from the template.</summary>
    public async Task<GenerateJourneyResult> GenerateAsync(int userId, string careerPathKey, CancellationToken ct = default)
    {
        if (!await _db.Users.AnyAsync(u => u.Id == userId, ct))
            throw new InvalidOperationException("User not found");

        var template = _templates.GetTemplate(careerPathKey);
        ValidateTemplateShape(template);

        var anchor = DateOnly.FromDateTime(DateTime.UtcNow);
        var planMonthStart = JourneyScheduleHelper.StartOfMonth(anchor);
        var planEnd = JourneyScheduleHelper.PlanHorizonEnd(planMonthStart, 60);

        await using var tx = await _db.Database.BeginTransactionAsync(ct);

        var existingPlans = await _db.JourneyPlans.Where(j => j.UserId == userId).ToListAsync(ct);
        if (existingPlans.Count > 0)
        {
            _db.JourneyPlans.RemoveRange(existingPlans);
            await _db.SaveChangesAsync(ct);
        }

        var now = DateTimeOffset.UtcNow;
        var plan = new JourneyPlan
        {
            UserId = userId,
            CareerPathKey = careerPathKey,
            PlanStartDate = anchor,
            PlanEndDate = planEnd,
            CreatedAt = now
        };
        _db.JourneyPlans.Add(plan);
        await _db.SaveChangesAsync(ct);

        var macro = new Milestone
        {
            UserId = userId,
            JourneyPlanId = plan.Id,
            ParentId = null,
            Title = TrimTitle(template.Northstar.Title),
            Description = TrimDescription(template.Northstar.Description),
            Tier = "macro",
            Category = null,
            Status = "pending",
            DueDate = planEnd,
            CreatedAt = now,
            UpdatedAt = now
        };
        _db.Milestones.Add(macro);
        await _db.SaveChangesAsync(ct);

        var count = 1;

        for (var y = 0; y < template.Years.Count; y++)
        {
            var yearDto = template.Years[y];
            if (yearDto.Quarters.Count != 4)
                throw new InvalidOperationException($"Template year {y + 1} must have exactly 4 quarters.");

            var yearDue = JourneyScheduleHelper.MonthEndFromPlanStart(planMonthStart, y * 12 + 11);
            var checkpoint = new Milestone
            {
                UserId = userId,
                JourneyPlanId = plan.Id,
                ParentId = macro.Id,
                Title = TrimTitle(yearDto.Title),
                Description = TrimDescription(yearDto.Description),
                Tier = "checkpoint",
                Category = null,
                Status = "pending",
                DueDate = yearDue,
                CreatedAt = now,
                UpdatedAt = now
            };
            _db.Milestones.Add(checkpoint);
            await _db.SaveChangesAsync(ct);
            count++;

            for (var q = 0; q < 4; q++)
            {
                var quarterDto = yearDto.Quarters[q];
                if (quarterDto.Months.Count != 3)
                    throw new InvalidOperationException($"Template Y{y + 1} Q{q + 1} must have exactly 3 months.");

                var quarterDue = JourneyScheduleHelper.MonthEndFromPlanStart(planMonthStart, y * 12 + q * 3 + 2);
                var domain = new Milestone
                {
                    UserId = userId,
                    JourneyPlanId = plan.Id,
                    ParentId = checkpoint.Id,
                    Title = TrimTitle(quarterDto.Title),
                    Description = TrimDescription(quarterDto.Description),
                    Tier = "domain",
                    Category = null,
                    Status = "pending",
                    DueDate = quarterDue,
                    CreatedAt = now,
                    UpdatedAt = now
                };
                _db.Milestones.Add(domain);
                await _db.SaveChangesAsync(ct);
                count++;

                for (var m = 0; m < 3; m++)
                {
                    var monthDto = quarterDto.Months[m];
                    var globalMonthIndex = y * 12 + q * 3 + m;
                    var monthDue = JourneyScheduleHelper.MonthEndFromPlanStart(planMonthStart, globalMonthIndex);
                    var cat = NormalizeCategory(monthDto.Category);
                    var daily = new Milestone
                    {
                        UserId = userId,
                        JourneyPlanId = plan.Id,
                        ParentId = domain.Id,
                        Title = TrimTitle(monthDto.Title),
                        Description = TrimDescription(monthDto.Description),
                        Tier = "daily",
                        Category = cat,
                        Status = "pending",
                        DueDate = monthDue,
                        CreatedAt = now,
                        UpdatedAt = now
                    };
                    _db.Milestones.Add(daily);
                    count++;
                }
            }
        }

        await _db.SaveChangesAsync(ct);

        var user = await _db.Users.FirstAsync(u => u.Id == userId, ct);
        user.StreakCount = await _db.Milestones.AsNoTracking()
            .CountAsync(m => m.UserId == userId && m.Status == "complete", ct);

        await _db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        return new GenerateJourneyResult(plan.Id, macro.Id, count, planEnd);
    }

    private static void ValidateTemplateShape(JourneyTemplateDto template)
    {
        if (template.Years.Count != 5)
            throw new InvalidOperationException("Journey template must define exactly 5 years.");
    }

    private static string TrimTitle(string raw)
    {
        var t = raw.Trim();
        return t.Length > 255 ? t[..255] : t;
    }

    private static string? TrimDescription(string? raw)
    {
        if (raw is null) return null;
        var t = raw.Trim();
        if (t.Length == 0) return null;
        return t.Length > 1000 ? t[..1000] : t;
    }

    private static string? NormalizeCategory(string? raw)
    {
        if (raw is null) return null;
        var c = raw.Trim();
        return ValidCategories.Contains(c) ? c : null;
    }
}

public sealed record GenerateJourneyResult(long JourneyPlanId, long NorthstarMilestoneId, int CreatedCount, DateOnly PlanEndDate);
