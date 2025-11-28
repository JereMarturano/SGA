using SGA.Models;
using SGA.Models.DTOs;

namespace SGA.Services;

public interface IVentaService
{
    Task<Venta> RegistrarVentaAsync(RegistrarVentaRequest request);
    Task<Venta?> ObtenerVentaPorIdAsync(int id);
    Task<List<Venta>> ObtenerVentasPorVehiculoYFechaAsync(int vehiculoId, DateTime fecha);
}
