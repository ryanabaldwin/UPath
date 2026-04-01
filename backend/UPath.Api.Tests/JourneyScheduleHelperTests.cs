using UPath.Api.Services;

namespace UPath.Api.Tests;

public class JourneyScheduleHelperTests
{
    [Fact]
    public void EndOfMonth_March_Returns31()
    {
        var d = new DateOnly(2026, 3, 15);
        Assert.Equal(new DateOnly(2026, 3, 31), JourneyScheduleHelper.EndOfMonth(d));
    }

    [Fact]
    public void MonthEndFromPlanStart_Month0_IsFirstMonthEnd()
    {
        var start = new DateOnly(2026, 3, 1);
        Assert.Equal(new DateOnly(2026, 3, 31), JourneyScheduleHelper.MonthEndFromPlanStart(start, 0));
    }

    [Fact]
    public void PlanHorizonEnd_60Months_SpansFiveYearsFromMarch()
    {
        var start = new DateOnly(2026, 3, 1);
        var end = JourneyScheduleHelper.PlanHorizonEnd(start, 60);
        Assert.Equal(new DateOnly(2031, 2, 28), end);
    }
}
