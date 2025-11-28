using SGA.Models;

namespace SGA.Services;

public interface IGastoVehiculoService
{
    Task<GastoVehiculo> RegistrarGastoAsync(GastoVehiculo gasto);
    Task<List<GastoVehiculo>> ObtenerGastosPorVehiculoAsync(int vehiculoId, DateTime? desde = null, DateTime? hasta = null);
    Task<GastoVehiculo?> ObtenerGastoPorIdAsync(int id);
    Task<GastoVehiculo?> ActualizarGastoAsync(int id, GastoVehiculo gasto);
    Task<bool> EliminarGastoAsync(int id);
}
