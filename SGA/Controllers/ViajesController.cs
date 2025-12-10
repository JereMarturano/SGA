using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SGA.Services;
using SGA.Models;

namespace SGA.Controllers;

[ApiController]
[Route("api/[controller]")]
// [Authorize(Roles = "Admin,Encargado,Oficina")] // Descomentar cuando el frontend envíe token
public class ViajesController : ControllerBase
{
    private readonly IViajeService _viajeService;

    public ViajesController(IViajeService viajeService)
    {
        _viajeService = viajeService;
    }

    [HttpPost("iniciar")]
    public async Task<IActionResult> IniciarViaje([FromBody] IniciarViajeDto dto)
    {
        try
        {
            var viaje = await _viajeService.IniciarViajeAsync(dto.VehiculoId, dto.ChoferId, dto.Observaciones);
            return Ok(viaje);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("finalizar/{id}")]
    public async Task<IActionResult> FinalizarViaje(int id, [FromBody] FinalizarViajeDto dto)
    {
        try
        {
            var viaje = await _viajeService.FinalizarViajeAsync(id, dto.Observaciones);
            return Ok(viaje);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("activos")]
    public async Task<IActionResult> GetActivos()
    {
        var viajes = await _viajeService.ObtenerViajesActivosAsync();
        return Ok(viajes);
    }
}

public class IniciarViajeDto
{
    public int VehiculoId { get; set; }
    public int ChoferId { get; set; }
    public string? Observaciones { get; set; }
}

public class FinalizarViajeDto
{
    public string? Observaciones { get; set; }
}
