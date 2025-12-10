using Microsoft.AspNetCore.Mvc;
using SGA.Models;
using SGA.Models.DTOs;
using SGA.Services;

using Microsoft.AspNetCore.Authorization;

namespace SGA.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class VentasController : ControllerBase
{
    private readonly IVentaService _ventaService;

    public VentasController(IVentaService ventaService)
    {
        _ventaService = ventaService;
    }

    [HttpPost]
    public async Task<ActionResult<Venta>> Registrar([FromBody] RegistrarVentaRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var venta = await _ventaService.RegistrarVentaAsync(request);
            return CreatedAtAction(nameof(ObtenerPorId), new { id = venta.VentaId }, venta);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message }); // Stock insuficiente
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERROR] Venta failed: {ex}");
            return StatusCode(500, new { message = "Error al procesar la venta.", error = ex.ToString() });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Venta>> ObtenerPorId(int id)
    {
        var venta = await _ventaService.ObtenerVentaPorIdAsync(id);
        if (venta == null)
        {
            return NotFound();
        }
        return Ok(venta);
    }

    [HttpGet("vehiculo/{vehiculoId}")]
    public async Task<ActionResult<List<Venta>>> ObtenerPorVehiculo(int vehiculoId, [FromQuery] DateTime? fecha, [FromQuery] bool exacto = false)
    {
        var fechaConsulta = fecha ?? DateTime.UtcNow;
        Console.WriteLine($"[DEBUG] ObtenerPorVehiculo: ID={vehiculoId}, FechaInput={fecha}, Exacto={exacto}");
        Console.WriteLine($"[DEBUG] FechaConsulta (Server): {fechaConsulta} Kind={fechaConsulta.Kind}");

        var ventas = await _ventaService.ObtenerVentasPorVehiculoYFechaAsync(vehiculoId, fechaConsulta, exacto);
        
        Console.WriteLine($"[DEBUG] Ventas encontradas: {ventas.Count}");
        if(ventas.Count > 0)
        {
             Console.WriteLine($"[DEBUG] Primera venta fecha: {ventas[0].Fecha} Kind={ventas[0].Fecha.Kind}");
        }

        return Ok(ventas);
    }

    [HttpGet("viaje/{viajeId}")]
    public async Task<ActionResult<List<Venta>>> ObtenerPorViaje(int viajeId)
    {
        var ventas = await _ventaService.ObtenerVentasPorViajeAsync(viajeId);
        return Ok(ventas);
    }

    [HttpGet("usuario/{usuarioId}")]
    public async Task<ActionResult<List<HistorialVentaDTO>>> ObtenerPorUsuario(int usuarioId, [FromQuery] int? mes, [FromQuery] int? anio)
    {
        var ventas = await _ventaService.ObtenerVentasPorUsuarioAsync(usuarioId, mes, anio);
        return Ok(ventas);
    }
}
