using Microsoft.AspNetCore.Mvc;
using SGA.Models;
using SGA.Models.DTOs;
using SGA.Services;

namespace SGA.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InventarioController : ControllerBase
{
    private readonly IInventarioService _inventarioService;

    public InventarioController(IInventarioService inventarioService)
    {
        _inventarioService = inventarioService;
    }

    [HttpPost("cargar-vehiculo")]
    public async Task<IActionResult> CargarVehiculo([FromBody] CargaVehiculoRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var items = request.Items.Select(i => (i.ProductoId, i.Cantidad)).ToList();
            await _inventarioService.CargarVehiculoAsync(request.VehiculoId, items, request.UsuarioId);
            return Ok(new { message = "Carga de vehículo registrada exitosamente." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al procesar la carga.", error = ex.Message });
        }
    }

    [HttpGet("stock-vehiculo/{vehiculoId}")]
    public async Task<ActionResult<List<StockVehiculo>>> ObtenerStockVehiculo(int vehiculoId)
    {
        var stock = await _inventarioService.ObtenerStockVehiculoAsync(vehiculoId);
        return Ok(stock);
    }

    [HttpPost("registrar-merma")]
    public async Task<IActionResult> RegistrarMerma([FromBody] MermaRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            await _inventarioService.RegistrarMermaAsync(request.VehiculoId, request.ProductoId, request.Cantidad, request.UsuarioId, request.Motivo);
            return Ok(new { message = "Merma registrada exitosamente." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al registrar la merma.", error = ex.Message });
        }
    }

    [HttpPost("compra")]
    public async Task<IActionResult> RegistrarCompra([FromBody] CompraRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            await _inventarioService.RegistrarCompraAsync(request);
            return Ok(new { message = "Compra registrada exitosamente. Stock actualizado y comprobante generado." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al registrar la compra.", error = ex.Message });
        }
    }
}
