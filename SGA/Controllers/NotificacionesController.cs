using Microsoft.AspNetCore.Mvc;
using SGA.Models;
using SGA.Services;

using Microsoft.AspNetCore.Authorization;

namespace SGA.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class NotificacionesController : ControllerBase
{
    private readonly INotificacionService _notificacionService;

    public NotificacionesController(INotificacionService notificacionService)
    {
        _notificacionService = notificacionService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Notificacion>>> ObtenerNotificaciones([FromQuery] int? usuarioId)
    {
        var notificaciones = await _notificacionService.ObtenerNotificacionesNoLeidasAsync(usuarioId);
        return Ok(notificaciones);
    }

    [HttpPost("{id}/leer")]
    public async Task<IActionResult> MarcarComoLeida(int id)
    {
        await _notificacionService.MarcarComoLeidaAsync(id);
        return Ok();
    }

    [HttpGet("historial")]
    public async Task<ActionResult<List<HistorialAccion>>> ObtenerHistorial([FromQuery] int cantidad = 50)
    {
        var historial = await _notificacionService.ObtenerHistorialRecienteAsync(cantidad);
        return Ok(historial);
    }
}
