using SGA.Models.DTOs;

namespace SGA.Services;

public interface IReporteService
{
    Task<ReporteFinancieroDTO> GenerarReporteFinancieroAsync(DateTime fechaInicio, DateTime fechaFin, int? vehiculoId = null);
    Task<List<StockEnCalleDTO>> ObtenerStockEnCalleAsync();
    Task<List<MermaReporteDTO>> ObtenerHistorialMermasAsync();
}
