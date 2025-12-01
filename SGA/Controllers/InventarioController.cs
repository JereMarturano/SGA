using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SGA.Models;
using SGA.Models.DTOs;
using SGA.Services;
using SGA.Data;

namespace SGA.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InventarioController : ControllerBase
{
    private readonly IInventarioService _inventarioService;
    private readonly AppDbContext _context;

    public InventarioController(IInventarioService inventarioService, AppDbContext context)
    {
        _inventarioService = inventarioService;
        _context = context;
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
            Console.WriteLine($"[ERROR] CargarVehiculo: {ex}");

            if (ex.Message.Contains("Stock insuficiente") || ex.Message.Contains("no encontrado"))
            {
                return BadRequest(new { message = ex.Message });
            }

            var innerMessage = ex.InnerException?.Message ?? "";
            return StatusCode(500, new { message = "Error al procesar la carga.", error = ex.Message, innerError = innerMessage });
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
            if (ex.Message.Contains("no encontrado"))
            {
                 return BadRequest(new { message = ex.Message });
            }
            return StatusCode(500, new { message = "Error al registrar la compra.", error = ex.Message });
        }
    }

    [HttpGet("usuarios")]
    public async Task<IActionResult> GetUsuarios()
    {
        var usuarios = await _context.Usuarios.ToListAsync();
        return Ok(usuarios);
    }
}
