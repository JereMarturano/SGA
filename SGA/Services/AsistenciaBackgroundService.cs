using Microsoft.EntityFrameworkCore;
using SGA.Data;
using SGA.Models;
using SGA.Models.Enums;
using SGA.Helpers;

namespace SGA.Services;

public class AsistenciaBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<AsistenciaBackgroundService> _logger;

    public AsistenciaBackgroundService(IServiceProvider serviceProvider, ILogger<AsistenciaBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Asistencia Background Service started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckAndRegisterAttendance(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while executing Asistencia task.");
            }

            // Calculate time until next run.
            // For simplicity, we check every hour, but we only act if it's a new day and required.
            // Or better: Run once, then wait until tomorrow morning (e.g., 00:01).
            // For now, sleeping 1 hour is safe enough.
            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }

    private async Task CheckAndRegisterAttendance(CancellationToken stoppingToken)
    {
        var now = TimeHelper.Now;

        // "menos los domingos, lunes a sabado, automaticamente un presente"
        if (now.DayOfWeek == DayOfWeek.Sunday)
        {
            return;
        }

        using (var scope = _serviceProvider.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            // Get all active employees
            // Assuming "Activo" or similar status, and relevant Roles (e.g., Chofer, Galponero, etc. but maybe not Admin/Oficina depending on requirements.
            // The prompt says "empleados" (employees). Usually Chofer, Galponero, Recolector, Vendedor.
            // Let's include all for now or filter by Status="Activo".
            var employees = await context.Usuarios
                .Where(u => u.Estado == "Activo")
                .ToListAsync(stoppingToken);

            var todayDate = now.Date;

            foreach (var emp in employees)
            {
                // Check if attendance already exists for today
                var exists = await context.Asistencias
                    .AnyAsync(a => a.UsuarioId == emp.UsuarioId && a.Fecha == todayDate, stoppingToken);

                if (!exists)
                {
                    // Create default Present
                    var asistencia = new Asistencia
                    {
                        UsuarioId = emp.UsuarioId,
                        Fecha = todayDate,
                        EstaPresente = true
                    };
                    context.Asistencias.Add(asistencia);
                    _logger.LogInformation($"Auto-assigning PRESENT to User {emp.UsuarioId} for {todayDate}");
                }
            }

            await context.SaveChangesAsync(stoppingToken);
        }
    }
}
