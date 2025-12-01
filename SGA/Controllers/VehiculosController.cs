using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SGA.Data;
using SGA.Models;

namespace SGA.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VehiculosController : ControllerBase
{
    private readonly AppDbContext _context;

    public VehiculosController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Vehiculo>>> GetVehiculos()
    {
        return await _context.Vehiculos.ToListAsync();
    }

    [HttpGet("stock-en-calle")]
    public async Task<ActionResult<IEnumerable<object>>> GetStockEnCalle()
    {
        var vehiculos = await _context.Vehiculos
            .Include(v => v.ChoferAsignado)
            .ToListAsync();

        var result = new List<object>();

        foreach (var v in vehiculos)
        {
            var stock = await _context.StockVehiculos
                .Where(s => s.VehiculoId == v.VehiculoId && s.Cantidad > 0)
                .Include(s => s.Producto)
                .Select(s => new 
                {
                    Producto = s.Producto.Nombre,
                    Cantidad = s.Cantidad
                })
                .ToListAsync();

            // Incluimos el vehículo incluso si no tiene stock, para saber que está vacío.
            // O si el usuario prefiere solo los que tienen stock.
            // "una vez que cargue los vehiculos, me aprezca el stock en calle"
            // Asumiremos que quiere ver todos los vehículos y su estado.
            
            result.Add(new 
            {
                Id = v.VehiculoId,
                Vehiculo = $"{v.Marca} {v.Modelo} ({v.Patente})",
                Chofer = v.ChoferAsignado?.Nombre ?? "Sin Asignar",
                EnRuta = v.EnRuta,
                Stock = stock
            });
        }

        return Ok(result);
    }
}
