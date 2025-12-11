using Microsoft.AspNetCore.Mvc;
using SGA.Services;

using Microsoft.AspNetCore.Authorization;

namespace SGA.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AlertasController : ControllerBase
{
    private readonly IAlertaService _alertaService;

    public AlertasController(IAlertaService alertaService)
    {
        _alertaService = alertaService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAlertas()
    {
        try
        {
            var alertas = await _alertaService.ObtenerAlertasOperativasAsync();
            return Ok(alertas);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error interno: {ex.Message}");
        }
    }

    [HttpPost("marcar-leida")]
    public async Task<IActionResult> MarcarComoLeida([FromQuery] string claveUnica)
    {
        try
        {
            await _alertaService.MarcarComoLeidaAsync(claveUnica);
            return Ok();
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error interno: {ex.Message}");
        }
    }

}
