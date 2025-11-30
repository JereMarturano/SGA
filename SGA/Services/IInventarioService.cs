using SGA.Models;
using SGA.Models.Enums;

namespace SGA.Services;

public interface IInventarioService
{
    Task CargarVehiculoAsync(int vehiculoId, List<(int ProductoId, decimal Cantidad)> items, int usuarioId);
    Task<List<StockVehiculo>> ObtenerStockVehiculoAsync(int vehiculoId);
    Task RegistrarMermaAsync(int vehiculoId, int productoId, decimal cantidad, int usuarioId, string motivo);
    Task RegistrarCompraAsync(int productoId, decimal cantidad, int usuarioId, string observaciones);
}
