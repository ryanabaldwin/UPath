namespace UPath.Api.Services;

public static class JourneyScheduleHelper
{
    public static DateOnly EndOfMonth(DateOnly anyDayInMonth)
    {
        var first = new DateOnly(anyDayInMonth.Year, anyDayInMonth.Month, 1);
        return first.AddMonths(1).AddDays(-1);
    }

    /// <summary>First day of the month containing <paramref name="anchor"/>.</summary>
    public static DateOnly StartOfMonth(DateOnly anchor) =>
        new(anchor.Year, anchor.Month, 1);

    /// <summary>End date of the month at <paramref name="monthIndex"/> (0-based) from plan start.</summary>
    public static DateOnly MonthEndFromPlanStart(DateOnly planMonthStart, int monthIndexZeroBased) =>
        EndOfMonth(planMonthStart.AddMonths(monthIndexZeroBased));

    public static DateOnly PlanHorizonEnd(DateOnly planMonthStart, int totalMonths = 60) =>
        MonthEndFromPlanStart(planMonthStart, totalMonths - 1);
}
