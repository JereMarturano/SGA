using System;

namespace SGA.Helpers;

public static class TimeHelper
{
    private static readonly TimeZoneInfo ArgentinaTimeZone;

    static TimeHelper()
    {
        try
        {
            ArgentinaTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Argentina Standard Time");
        }
        catch (TimeZoneNotFoundException)
        {
            try
            {
                ArgentinaTimeZone = TimeZoneInfo.FindSystemTimeZoneById("America/Argentina/Buenos_Aires");
            }
            catch (TimeZoneNotFoundException)
            {
                // Fallback to a fixed offset if neither is found (e.g., usually UTC-3)
                ArgentinaTimeZone = TimeZoneInfo.CreateCustomTimeZone("Argentina Fallback", TimeSpan.FromHours(-3), "Argentina Standard Time", "Argentina Standard Time");
            }
        }
    }

    public static DateTime Now => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, ArgentinaTimeZone);
}
