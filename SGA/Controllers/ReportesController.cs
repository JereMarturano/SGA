using Microsoft.AspNetCore.Mvc;
using SGA.Models.DTOs;
using SGA.Services;

namespace SGA.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportesController : ControllerBase
{
    private readonly IReporteService _reporteService;

    public ReportesController(IReporteService reporteService)
    {
        _reporteService = reporteService;
    }

    [HttpGet("financiero")]
    public async Task<ActionResult<ReporteFinancieroDTO>> ObtenerReporteFinanciero(
        [FromQuery] DateTime inicio, 
        [FromQuery] DateTime fin, 
        [FromQuery] int? vehiculoId)
    {
        if (inicio > fin)
        {
            return BadRequest("La fecha de inicio no puede ser mayor a la fecha de fin.");
        }

        try
        {
            var reporte = await _reporteService.GenerarReporteFinancieroAsync(inicio, fin, vehiculoId);
            return Ok(reporte);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al generar el reporte.", error = ex.Message });
        }
    }

    [HttpGet("stock-calle")]
    public async Task<ActionResult<List<StockEnCalleDTO>>> ObtenerStockEnCalle()
    {
        try
        {
            var reporte = await _reporteService.ObtenerStockEnCalleAsync();
            return Ok(reporte);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERROR] Error obteniendo stock en calle: {ex}");
            return StatusCode(500, new { message = "Error al obtener stock en calle.", error = ex.Message });
        }
    }

    [HttpGet("mermas-historial")]
    public async Task<ActionResult<List<MermaReporteDTO>>> ObtenerHistorialMermas()
    {
        try
        {
            var reporte = await _reporteService.ObtenerHistorialMermasAsync();
            return Ok(reporte);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al obtener historial de mermas.", error = ex.Message });
        }
    }
}
