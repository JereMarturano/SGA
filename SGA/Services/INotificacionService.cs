using SGA.Models;

namespace SGA.Services;

public interface INotificacionService
{
    Task CrearNotificacionAsync(string mensaje, string tipo = "General", int? usuarioId = null);
    Task RegistrarAccionAsync(string accion, string entidad, string entidadId, int? usuarioId, string? detalles = null);
    Task<List<Notificacion>> ObtenerNotificacionesNoLeidasAsync(int? usuarioId = null);
    Task MarcarComoLeidaAsync(int notificacionId);
    Task<List<HistorialAccion>> ObtenerHistorialRecienteAsync(int cantidad = 50);
}
