using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SGA.Models;
using SGA.Services;

namespace SGA.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PedidosController : ControllerBase
{
    private readonly IPedidoService _pedidoService;
    private readonly IViajeService _viajeService;

    public PedidosController(IPedidoService pedidoService, IViajeService viajeService)
    {
        _pedidoService = pedidoService;
        _viajeService = viajeService;
    }

    [HttpGet("pendientes")]
    public async Task<IActionResult> GetPendientes()
    {
        var pedidos = await _pedidoService.GetPedidosPendientesAsync();
        return Ok(pedidos);
    }

    [HttpGet("por-viaje/{viajeId}")]
    public async Task<IActionResult> GetPorViaje(int viajeId)
    {
        var pedidos = await _pedidoService.GetPedidosPorViajeAsync(viajeId);
        return Ok(pedidos);
    }

    [HttpPost]
    public async Task<IActionResult> CrearPedido([FromBody] Pedido pedido)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        
        try
        {
            // Reset ID to 0 just in case
            pedido.PedidoId = 0;
            // Ensure details have 0 ID too? EF ignores if configured. 
            // Better to process DTOs usually, but using Model is acceptable for MVP.
            
            var created = await _pedidoService.CrearPedidoAsync(pedido);
            return Ok(created);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePedido(int id, [FromBody] Pedido pedido)
    {
        try
        {
            var updated = await _pedidoService.UpdatePedidoAsync(id, pedido);
            return Ok(updated);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePedido(int id)
    {
        var result = await _pedidoService.DeletePedidoAsync(id);
        if (!result) return NotFound();
        return Ok();
    }

    [HttpPost("asignar-viaje")]
    public async Task<IActionResult> AsignarViaje([FromBody] AsignarViajeDto dto)
    {
        try
        {
            await _pedidoService.AsignarPedidosAViajeAsync(dto.ViajeId, dto.PedidoIds);
            return Ok(new { message = "Pedidos asignados con éxito." });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{id}/entregado")]
    public async Task<IActionResult> MarcarEntregado(int id)
    {
        try
        {
            await _pedidoService.MarcarEntregadoAsync(id);
            return Ok(new { message = "Pedido entregado." });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}

public class AsignarViajeDto
{
    public int ViajeId { get; set; }
    public List<int> PedidoIds { get; set; } = new();
}
