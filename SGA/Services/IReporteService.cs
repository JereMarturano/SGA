using SGA.Models.DTOs;
using System.Collections.Generic;

namespace SGA.Services;

public interface IReporteService
{
    Task<ReporteFinancieroDTO> GenerarReporteFinancieroAsync(DateTime fechaInicio, DateTime fechaFin, int? vehiculoId = null);
    Task<List<StockEnCalleDTO>> ObtenerStockEnCalleAsync();
    Task<List<MermaReporteDTO>> ObtenerHistorialMermasAsync();
    Task<List<ReporteVentaEmpleadoDto>> ObtenerVentasPorEmpleadoAsync(DateTime? fechaInicio, DateTime? fechaFin);
}
