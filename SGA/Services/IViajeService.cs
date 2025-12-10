using SGA.Models;
using SGA.Models.Enums;

namespace SGA.Services;

public interface IViajeService
{
    Task<Viaje> IniciarViajeAsync(int vehiculoId, int choferId, string? observaciones);
    Task<Viaje> FinalizarViajeAsync(int viajeId, string? observaciones);
    Task<Viaje?> ObtenerViajeActivoPorUsuarioAsync(int usuarioId);
    Task<List<Viaje>> ObtenerViajesActivosAsync();
}
