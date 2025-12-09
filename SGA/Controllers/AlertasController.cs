using Microsoft.AspNetCore.Mvc;
using SGA.Services;

namespace SGA.Controllers;

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

}
