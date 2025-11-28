using Microsoft.AspNetCore.Mvc;
using SGA.Models;
using SGA.Services;

namespace SGA.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GastosVehiculosController : ControllerBase
{
    private readonly IGastoVehiculoService _gastoService;

    public GastosVehiculosController(IGastoVehiculoService gastoService)
    {
        _gastoService = gastoService;
    }

    [HttpPost]
    public async Task<ActionResult<GastoVehiculo>> Registrar([FromBody] GastoVehiculo gasto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Validaciones de negocio adicionales podrían ir aquí
        // Ejemplo: Validar que el kilometraje sea mayor al anterior si es el mismo vehículo (requeriría lógica en servicio)

        var nuevoGasto = await _gastoService.RegistrarGastoAsync(gasto);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = nuevoGasto.GastoId }, nuevoGasto);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<GastoVehiculo>> ObtenerPorId(int id)
    {
        var gasto = await _gastoService.ObtenerGastoPorIdAsync(id);
        if (gasto == null)
        {
            return NotFound();
        }
        return Ok(gasto);
    }

    [HttpGet("vehiculo/{vehiculoId}")]
    public async Task<ActionResult<List<GastoVehiculo>>> ObtenerPorVehiculo(int vehiculoId, [FromQuery] DateTime? desde, [FromQuery] DateTime? hasta)
    {
        var gastos = await _gastoService.ObtenerGastosPorVehiculoAsync(vehiculoId, desde, hasta);
        return Ok(gastos);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<GastoVehiculo>> Actualizar(int id, [FromBody] GastoVehiculo gasto)
    {
        if (id != gasto.GastoId)
        {
            return BadRequest("El ID del gasto no coincide.");
        }

        var actualizado = await _gastoService.ActualizarGastoAsync(id, gasto);
        if (actualizado == null)
        {
            return NotFound();
        }

        return Ok(actualizado);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var eliminado = await _gastoService.EliminarGastoAsync(id);
        if (!eliminado)
        {
            return NotFound();
        }
        return NoContent();
    }
}
