using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SGA.Models;
using SGA.Models.DTOs;
using SGA.Services;
using SGA.Data;
using Microsoft.AspNetCore.Authorization;

namespace SGA.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class InventarioController : ControllerBase
{
    private readonly IInventarioService _inventarioService;
    private readonly IViajeService _viajeService;
    private readonly AppDbContext _context;

    public InventarioController(IInventarioService inventarioService, IViajeService viajeService, AppDbContext context)
    {
        _inventarioService = inventarioService;
        _viajeService = viajeService;
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
            await _inventarioService.CargarVehiculoAsync(request.VehiculoId, items, request.UsuarioId, request.ChoferId);
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

    [HttpGet("historial-cargas")]
    public async Task<IActionResult> GetHistorialCargas()
    {
        var historial = await _inventarioService.ObtenerHistorialCargasAsync();
        
        var grouped = historial
            .GroupBy(h => new { h.Fecha, h.VehiculoId, h.Vehiculo?.Marca, h.Vehiculo?.Modelo })
            .Select(g => new 
            {
                Id = g.First().MovimientoId,
                Fecha = g.Key.Fecha.ToString("o"), // Full ISO string for frontend parsing
                Vehiculo = $"{g.Key.Marca} {g.Key.Modelo}",
                TotalHuevos = g.Sum(x => Math.Abs(x.Cantidad)), // Use Abs just in case, though it should be positive
                ItemsCount = g.Count()
            })
            .ToList();

        return Ok(grouped);
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

    [Authorize(Roles = "Admin,Encargado,Recolector")]
    [HttpPost("registrar-merma-general")]
    public async Task<IActionResult> RegistrarMermaGeneral([FromBody] MermaGeneralRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            await _inventarioService.RegistrarMermaGeneralAsync(request.ProductoId, request.Cantidad, request.EsMaple, request.UsuarioId, request.Motivo);
            return Ok(new { message = "Merma general registrada exitosamente." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al registrar la merma general.", error = ex.Message });
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

    [HttpPost("cerrar-reparto")]
    public async Task<IActionResult> CerrarReparto([FromBody] CerrarRepartoDTO request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            // Mapeamos DTO a modelo interno
            var internalRequest = new CerrarRepartoRequest
            {
                VehiculoId = request.VehiculoId,
                UsuarioId = request.UsuarioId,
                NuevoKilometraje = request.NuevoKilometraje,
                StockRetorno = request.StockRetorno.Select(s => new StockRetornoItem
                {
                    ProductoId = s.ProductoId,
                    CantidadFisica = s.CantidadFisica
                }).ToList()
            };

            // 1. Obtener el viaje activo ANTES de cerrar el reparto (porque cerrar reparto cambia estado del vehículo)
            var viajeActivo = await _viajeService.ObtenerViajeActivoPorVehiculoAsync(request.VehiculoId);

            // 2. Cerrar reparto (Inventario y Vehículo)
            await _inventarioService.CerrarRepartoAsync(internalRequest);

            // 3. Finalizar el Viaje formalmente (si existe)
            if (viajeActivo != null)
            {
                await _viajeService.FinalizarViajeAsync(viajeActivo.ViajeId, "Cierre automático desde Stock en Calle");
            }

            return Ok(new { message = "Reparto cerrado exitosamente. Stock retornado a depósito y Viaje Finalizado." });
        }
        catch (Exception ex)
        {
            if (ex.Message.Contains("no puede ser menor al actual"))
            {
                return BadRequest(new { message = ex.Message });
            }
            return StatusCode(500, new { message = "Error al cerrar reparto.", error = ex.Message });
        }
    }

    [HttpGet("debug-vehiculos")]
    public async Task<IActionResult> GetVehiculosDebug()
    {
        var vehiculos = await _context.Vehiculos.ToListAsync();
        return Ok(vehiculos);
    }

    [HttpGet("debug-compras")]
    [AllowAnonymous]
    public async Task<IActionResult> DebugCompras()
    {
        var compras = await _context.Compras
            .OrderByDescending(c => c.Fecha)
            .Take(10)
            .ToListAsync();
        
        var serverTime = SGA.Helpers.TimeHelper.Now;
        var utcTime = DateTime.UtcNow;
        
        return Ok(new { 
            ServerTime = serverTime, 
            UtcTime = utcTime, 
            Compras = compras.Select(c => new { 
                c.CompraId, 
                c.Fecha, 
                FechaKind = c.Fecha.Kind.ToString(), 
                c.Total 
            }) 
        });
    }
    [HttpGet("resumen-caja/{vehiculoId}")]
    public async Task<ActionResult<ResumenCajaDTO>> GetResumenCaja(int vehiculoId)
    {
        try
        {
            var resumen = await _inventarioService.ObtenerResumenCajaAsync(vehiculoId);
            return Ok(resumen);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al obtener resumen de caja.", error = ex.Message });
        }
    }
}

public class CerrarRepartoDTO
{
    public int VehiculoId { get; set; }
    public int UsuarioId { get; set; }
    public decimal NuevoKilometraje { get; set; }
    public List<StockRetornoItemDTO> StockRetorno { get; set; } = new();
}

public class StockRetornoItemDTO
{
    public int ProductoId { get; set; }
    public decimal CantidadFisica { get; set; }
}
