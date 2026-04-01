namespace UPath.Api.Services;

/// <summary>Rollups for ETA and quarterly progress from a flat milestone list.</summary>
public static class MilestoneTreeSummaryCalculator
{
    public sealed record FlatNode(
        long Id,
        long? ParentId,
        string Tier,
        string Status,
        string? DueDate,
        string Title);

    public sealed class MilestoneTreeSummaryDto
    {
        public string? EstimatedCompletionDate { get; init; }
        public int? EstimatedTimeRemainingDays { get; init; }
        public int PlanProgressPercent { get; init; }
        public int TotalDailySteps { get; init; }
        public int CompletedDailySteps { get; init; }
        public CurrentQuarterSummaryDto? CurrentQuarter { get; init; }
        public List<QuarterRollupDto> QuarterRollups { get; init; } = [];
    }

    public sealed class CurrentQuarterSummaryDto
    {
        public string Label { get; init; } = "";
        public string? DueDate { get; init; }
        public int ProgressPercent { get; init; }
        public int CompletedSteps { get; init; }
        public int TotalSteps { get; init; }
        public int? DaysRemainingInQuarter { get; init; }
    }

    public sealed class QuarterRollupDto
    {
        public string Label { get; init; } = "";
        public string? DueDate { get; init; }
        public int ProgressPercent { get; init; }
        public int CompletedSteps { get; init; }
        public int TotalSteps { get; init; }
    }

    public static MilestoneTreeSummaryDto Compute(IReadOnlyList<FlatNode> nodes, DateOnly todayUtc)
    {
        var dailies = nodes.Where(n => n.Tier == "daily").ToList();
        var totalD = dailies.Count;
        var completedD = dailies.Count(n => n.Status == "complete");
        var progressPct = totalD > 0 ? (int)Math.Round(100.0 * completedD / totalD) : 0;

        DateOnly? planEnd = null;
        foreach (var n in nodes)
        {
            if (n.DueDate is { } ds && DateOnly.TryParse(ds, out var d))
            {
                if (planEnd is null || d > planEnd.Value)
                    planEnd = d;
            }
        }

        var estimatedCompletion = planEnd?.ToString("yyyy-MM-dd");
        int? remainingDays = null;
        if (planEnd is { } pe)
        {
            if (totalD > 0 && completedD >= totalD)
                remainingDays = 0;
            else
                remainingDays = Math.Max(0, pe.DayNumber - todayUtc.DayNumber);
        }

        var domains = nodes.Where(n => n.Tier == "domain").OrderBy(n => n.DueDate).ToList();
        var childrenByParent = nodes
            .Where(n => n.ParentId.HasValue)
            .GroupBy(n => n.ParentId!.Value)
            .ToDictionary(g => g.Key, g => g.ToList());

        var quarterRollups = new List<QuarterRollupDto>();
        foreach (var dom in domains)
        {
            var (c, t) = CountDailiesUnder(dom.Id, childrenByParent);
            var pct = t > 0 ? (int)Math.Round(100.0 * c / t) : 0;
            quarterRollups.Add(new QuarterRollupDto
            {
                Label = dom.Title,
                DueDate = dom.DueDate,
                ProgressPercent = pct,
                CompletedSteps = c,
                TotalSteps = t
            });
        }

        CurrentQuarterSummaryDto? current = null;
        if (domains.Count > 0)
        {
            FlatNode? pick = null;
            foreach (var dom in domains)
            {
                if (dom.DueDate is { } ds && DateOnly.TryParse(ds, out var due))
                {
                    if (due >= todayUtc)
                    {
                        pick = dom;
                        break;
                    }
                }
            }

            pick ??= domains[^1];

            var (cc, tt) = CountDailiesUnder(pick.Id, childrenByParent);
            var cpct = tt > 0 ? (int)Math.Round(100.0 * cc / tt) : 0;
            int? daysLeft = null;
            if (pick.DueDate is { } pds && DateOnly.TryParse(pds, out var qEnd))
                daysLeft = Math.Max(0, qEnd.DayNumber - todayUtc.DayNumber);

            current = new CurrentQuarterSummaryDto
            {
                Label = pick.Title,
                DueDate = pick.DueDate,
                ProgressPercent = cpct,
                CompletedSteps = cc,
                TotalSteps = tt,
                DaysRemainingInQuarter = daysLeft
            };
        }

        return new MilestoneTreeSummaryDto
        {
            EstimatedCompletionDate = estimatedCompletion,
            EstimatedTimeRemainingDays = remainingDays,
            PlanProgressPercent = progressPct,
            TotalDailySteps = totalD,
            CompletedDailySteps = completedD,
            CurrentQuarter = current,
            QuarterRollups = quarterRollups
        };
    }

    private static (int Complete, int Total) CountDailiesUnder(
        long rootId,
        IReadOnlyDictionary<long, List<FlatNode>> childrenByParent)
    {
        var complete = 0;
        var total = 0;
        var stack = new Stack<long>();
        stack.Push(rootId);
        while (stack.Count > 0)
        {
            var id = stack.Pop();
            if (!childrenByParent.TryGetValue(id, out var kids))
                continue;
            foreach (var k in kids)
            {
                if (k.Tier == "daily")
                {
                    total++;
                    if (k.Status == "complete")
                        complete++;
                }
                stack.Push(k.Id);
            }
        }

        return (complete, total);
    }
}
