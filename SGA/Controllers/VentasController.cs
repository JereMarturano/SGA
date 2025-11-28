using Microsoft.AspNetCore.Mvc;
using SGA.Models;
using SGA.Models.DTOs;
using SGA.Services;

namespace SGA.Controllers;

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
            return StatusCode(500, new { message = "Error al procesar la venta.", error = ex.Message });
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
    public async Task<ActionResult<List<Venta>>> ObtenerPorVehiculo(int vehiculoId, [FromQuery] DateTime? fecha)
    {
        var fechaConsulta = fecha ?? DateTime.UtcNow;
        var ventas = await _ventaService.ObtenerVentasPorVehiculoYFechaAsync(vehiculoId, fechaConsulta);
        return Ok(ventas);
    }
}
