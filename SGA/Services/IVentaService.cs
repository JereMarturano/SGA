using SGA.Models;
using SGA.Models.DTOs;

namespace SGA.Services;

public interface IVentaService
{
    Task<Venta> RegistrarVentaAsync(RegistrarVentaRequest request);
    Task<Venta?> ObtenerVentaPorIdAsync(int id);
    Task<List<Venta>> ObtenerVentasPorVehiculoYFechaAsync(int vehiculoId, DateTime fecha, bool exacto = false);
    Task<List<Venta>> ObtenerVentasPorViajeAsync(int viajeId);
    Task<List<HistorialVentaDTO>> ObtenerVentasPorClienteAsync(int clienteId);
    Task<List<HistorialVentaDTO>> ObtenerVentasPorUsuarioAsync(int usuarioId, int? mes = null, int? anio = null);
    Task CancelarVentaAsync(int ventaId, string motivo);
}
