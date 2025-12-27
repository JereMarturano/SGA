using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SGA.Models;
using SGA.Services;
using System.Security.Claims;

namespace SGA.Controllers;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class CierreCajaController : ControllerBase
{
    private readonly ICierreCajaService _cierreCajaService;

    public CierreCajaController(ICierreCajaService cierreCajaService)
    {
        _cierreCajaService = cierreCajaService;
    }

    [HttpGet("resumen")]
    public async Task<ActionResult<CierreCajaDiario>> GetResumen([FromQuery] DateTime fecha)
    {
        try
        {
            var resumen = await _cierreCajaService.CalcularResumen(fecha);
            return Ok(resumen);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error al calcular resumen: {ex.Message}");
        }
    }

    [HttpPost]
    public async Task<ActionResult<CierreCajaDiario>> CerrarCaja([FromBody] CierreCajaDiario cierre)
    {
        try
        {
            // Obtener ID del usuario actual
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized("Usuario no identificado");
            }

            var nuevoCierre = await _cierreCajaService.CerrarCaja(cierre, userId);
            return Ok(nuevoCierre);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error al cerrar caja: {ex.Message}");
        }
    }

    [HttpGet("historial")]
    public async Task<ActionResult<IEnumerable<CierreCajaDiario>>> GetHistorial()
    {
        try
        {
            var historial = await _cierreCajaService.ObtenerHistorial();
            return Ok(historial);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error al obtener historial: {ex.Message}");
        }
    }

    [HttpGet("existe")]
    public async Task<ActionResult<bool>> ExisteCierre([FromQuery] DateTime fecha)
    {
        try
        {
            var existe = await _cierreCajaService.ExisteCierre(fecha);
            return Ok(existe);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error al verificar cierre: {ex.Message}");
        }
    }
}
