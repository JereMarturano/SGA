using System;

namespace SGA.Helpers;

public static class TimeHelper
{
    private static readonly TimeSpan ArgentinaOffset = TimeSpan.FromHours(-3);

    // Force simple UTC offset calculation to avoid cross-platform timezone DB issues
    public static DateTime Now => DateTime.UtcNow.Add(ArgentinaOffset);
}
