using SGA.Models;
using SGA.Models.Enums;
using SGA.Models.DTOs;

namespace SGA.Services;

public interface IInventarioService
{
    Task CargarVehiculoAsync(int vehiculoId, List<(int ProductoId, decimal Cantidad)> items, int usuarioId, int? choferId = null);
    Task<List<MovimientoStock>> ObtenerHistorialCargasAsync();
    Task<List<StockVehiculo>> ObtenerStockVehiculoAsync(int vehiculoId);
    Task RegistrarMermaAsync(int vehiculoId, int productoId, decimal cantidad, int usuarioId, string motivo);
    Task RegistrarCompraAsync(CompraRequest request);
}
