using System;

namespace SGA.Helpers;

public static class TimeHelper
{
    private static readonly TimeZoneInfo ArgentinaTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Argentina Standard Time");

    public static DateTime Now => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, ArgentinaTimeZone);
}
