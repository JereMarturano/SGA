using Microsoft.EntityFrameworkCore;
using SGA.Data;
using SGA.Models;
using SGA.Helpers;

namespace SGA.Services;

public class NotificacionService : INotificacionService
{
    private readonly AppDbContext _context;

    public NotificacionService(AppDbContext context)
    {
        _context = context;
    }

    public async Task CrearNotificacionAsync(string mensaje, string tipo = "General", int? usuarioId = null)
    {
        var notificacion = new Notificacion
        {
            Mensaje = mensaje,
            Tipo = tipo,
            UsuarioId = usuarioId,
            FechaCreacion = TimeHelper.Now,
            Leido = false
        };

        _context.Notificaciones.Add(notificacion);
        await _context.SaveChangesAsync();
    }

    public async Task RegistrarAccionAsync(string accion, string entidad, string entidadId, int? usuarioId, string? detalles = null)
    {
        var historial = new HistorialAccion
        {
            Accion = accion,
            Entidad = entidad,
            EntidadId = entidadId,
            UsuarioId = usuarioId,
            Detalles = detalles,
            Fecha = TimeHelper.Now
        };

        _context.HistorialAcciones.Add(historial);
        await _context.SaveChangesAsync();
    }

    public async Task<List<Notificacion>> ObtenerNotificacionesNoLeidasAsync(int? usuarioId = null)
    {
        var query = _context.Notificaciones.Where(n => !n.Leido);

        if (usuarioId.HasValue)
        {
            query = query.Where(n => n.UsuarioId == null || n.UsuarioId == usuarioId);
        }

        return await query.OrderByDescending(n => n.FechaCreacion).ToListAsync();
    }

    public async Task MarcarComoLeidaAsync(int notificacionId)
    {
        var notificacion = await _context.Notificaciones.FindAsync(notificacionId);
        if (notificacion != null)
        {
            notificacion.Leido = true;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<List<HistorialAccion>> ObtenerHistorialRecienteAsync(int cantidad = 50)
    {
        return await _context.HistorialAcciones
            .Include(h => h.Usuario)
            .OrderByDescending(h => h.Fecha)
            .Take(cantidad)
            .ToListAsync();
    }
}
