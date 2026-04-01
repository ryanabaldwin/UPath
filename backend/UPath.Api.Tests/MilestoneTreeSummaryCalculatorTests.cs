using UPath.Api.Services;

namespace UPath.Api.Tests;

public class MilestoneTreeSummaryCalculatorTests
{
    [Fact]
    public void Compute_AllDailiesComplete_RemainingDaysZero()
    {
        var nodes = new List<MilestoneTreeSummaryCalculator.FlatNode>
        {
            new(1, null, "macro", "pending", "2031-02-28", "Goal"),
            new(2, 1, "checkpoint", "pending", "2027-03-31", "Y1"),
            new(3, 2, "domain", "pending", "2026-05-31", "Q1"),
            new(4, 3, "daily", "complete", "2026-03-31", "M1"),
            new(5, 3, "daily", "complete", "2026-04-30", "M2"),
            new(6, 3, "daily", "complete", "2026-05-31", "M3"),
        };

        var today = new DateOnly(2026, 3, 15);
        var s = MilestoneTreeSummaryCalculator.Compute(nodes, today);

        Assert.Equal(100, s.PlanProgressPercent);
        Assert.Equal(0, s.EstimatedTimeRemainingDays);
        Assert.Equal(3, s.TotalDailySteps);
        Assert.Equal(3, s.CompletedDailySteps);
    }

    [Fact]
    public void Compute_QuarterRollup_CountsDescendantDailies()
    {
        var nodes = new List<MilestoneTreeSummaryCalculator.FlatNode>
        {
            new(10, null, "macro", "pending", null, "NS"),
            new(11, 10, "checkpoint", "pending", null, "Y1"),
            new(12, 11, "domain", "pending", "2026-06-30", "Q2"),
            new(13, 12, "daily", "complete", null, "a"),
            new(14, 12, "daily", "pending", null, "b"),
        };

        var s = MilestoneTreeSummaryCalculator.Compute(nodes, new DateOnly(2026, 4, 1));
        Assert.Single(s.QuarterRollups);
        Assert.Equal(50, s.QuarterRollups[0].ProgressPercent);
        Assert.NotNull(s.CurrentQuarter);
        Assert.Equal("Q2", s.CurrentQuarter!.Label);
    }
}
