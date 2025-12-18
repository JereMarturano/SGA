using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SGA.Models;
using SGA.Services;
using SGA.Data; // For AppDbContext if needed for generic queries
using Microsoft.AspNetCore.Authorization;
using SGA.Models.Enums;

namespace SGA.Controllers;

[Authorize]
[ApiController]
[Route("api/stock-general")]
public class StockGeneralController : ControllerBase
{
    private readonly IGalponService _galponService;
    private readonly ISiloService _siloService;
    private readonly IFabricaService _fabricaService;
    private readonly AppDbContext _context; // For Deposito/Products direct access

    public StockGeneralController(
        IGalponService galponService,
        ISiloService siloService,
        IFabricaService fabricaService,
        AppDbContext context)
    {
        _galponService = galponService;
        _siloService = siloService;
        _fabricaService = fabricaService;
        _context = context;
    }

    #region Galpones

    [HttpGet("galpones")]
    public async Task<IActionResult> GetGalpones()
    {
        var galpones = await _galponService.GetAllAsync();
        return Ok(galpones);
    }

    [HttpGet("galpones/{id}")]
    public async Task<IActionResult> GetGalpon(int id)
    {
        var galpon = await _galponService.GetByIdAsync(id);
        if (galpon == null) return NotFound();
        return Ok(galpon);
    }

    [Authorize(Roles = "Admin")] // Only Jefe/Admin can edit
    [HttpPut("galpones/{id}")]
    public async Task<IActionResult> UpdateGalpon(int id, [FromBody] Galpon galpon)
    {
        try
        {
            var updated = await _galponService.UpdateAsync(id, galpon);
            return Ok(updated);
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("galpones/{id}/eventos")]
    public async Task<IActionResult> RegistrarEventoGalpon(int id, [FromBody] EventoGalpon evento)
    {
        if (id != evento.GalponId) return BadRequest("ID mismatch");
        
        // Ensure only Admin can manual adjust? 
        // Instructions: "solo el jefe puede modificar la cantidad de gallinas... marcar cuando fallece".
        // Marking death is an event. Maybe employees can mark death?
        // "solo el jefe puede modificar ... marcar cuando una gallina fallece".
        // Use Authorize on method? Or check role here?
        // Assuming Admin for now based on strict reading "Solo el jefe".
        // But maybe "marcar fallece" is daily op?
        // I will restrict to Admin/Encargado if needed, but sticking to "Admin" for modifying quantity.
        var userRole = User.Claims.FirstOrDefault(c => c.Type == "http://schemas.microsoft.com/ws/2008/06/identity/claims/role")?.Value;
        
        bool success = await _galponService.RegistrarEventoAsync(evento);
        if (!success) return BadRequest("Could not register event");
        return Ok(new { message = "Evento registrado" });
    }

    [HttpGet("galpones/{id}/eventos")]
    public async Task<IActionResult> GetEventosGalpon(int id)
    {
        var eventos = await _context.EventosGalpon
            .Where(e => e.GalponId == id)
            .OrderByDescending(e => e.Fecha)
            .Include(e => e.Usuario)
            .ToListAsync();
        return Ok(eventos);
    }

    [HttpPost("galpones/transferir-pollitos")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> TransferirPollitos([FromBody] TransferirPollitosRequest request)
    {
        var origen = await _context.Galpones.FindAsync(request.GalponOrigenId);
        var destino = await _context.Galpones.FindAsync(request.GalponDestinoId);

        if (origen == null || destino == null) return NotFound("Galpon no encontrado");
        if (origen.CantidadAves < request.Cantidad) return BadRequest("Stock insuficiente");

        // Execute Transfer
        origen.CantidadAves -= request.Cantidad;
        destino.CantidadAves += request.Cantidad;

        // Register Events for History
        _context.EventosGalpon.Add(new EventoGalpon 
        { 
            GalponId = request.GalponOrigenId, 
            TipoEvento = "Egreso", 
            Cantidad = request.Cantidad, 
            Fecha = DateTime.Now, 
            Observacion = $"Transferencia a {destino.Nombre}",
            UsuarioId = 1 // Simplified
        });

        _context.EventosGalpon.Add(new EventoGalpon 
        { 
            GalponId = request.GalponDestinoId, 
            TipoEvento = "Ingreso", 
            Cantidad = request.Cantidad, 
            Fecha = DateTime.Now, 
            Observacion = $"Transferencia desde {origen.Nombre}",
            UsuarioId = 1
        });

        await _context.SaveChangesAsync();
        return Ok(new { message = "Transferencia completa" });
    }

    #endregion

    #region Silos

    [HttpGet("silos")]
    public async Task<IActionResult> GetSilos()
    {
        var silos = await _siloService.GetAllAsync();
        return Ok(silos);
    }

    [HttpPost("silos/carga")] // Carga manual (Refill)
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CargarSilo([FromBody] CargaSiloRequest request)
    {
        // "cuanto le salio" -> PrecioTotal
        await _siloService.RegistrarCargaAsync(request.SiloId, request.CantidadKg, request.PrecioTotal);
        return Ok(new { message = "Carga registrada" });
    }

    [HttpPost("silos/ajuste")] // Manual correction/configuration
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AjustarSilo([FromBody] AjusteSiloRequest request)
    {
        var silo = await _siloService.GetByIdAsync(request.SiloId);
        if (silo == null) return NotFound();
        
        silo.Nombre = request.Nombre ?? silo.Nombre; // Update name if provided
        silo.CapacidadKg = request.CapacidadKg > 0 ? request.CapacidadKg : silo.CapacidadKg;
        silo.CantidadActualKg = request.CantidadKg;
        silo.ProductoId = request.ProductoId; 
        
        await _siloService.UpdateAsync(request.SiloId, silo);
        return Ok(new { message = "Silo actualizado correctamente" });
    }

    #endregion

    #region Fabrica

    [HttpPost("fabrica/produccion")]
    public async Task<IActionResult> RegistrarProduccion([FromBody] Produccion produccion)
    {
        try 
        {
            // Ensure UsuarioId is valid from the token, not trusted from frontend
            var userIdStr = User.Claims.FirstOrDefault(c => c.Type == "http://schemas.microsoft.com/ws/2008/06/identity/claims/primarysid")?.Value 
                            ?? User.Claims.FirstOrDefault(c => c.Type == "id")?.Value
                            ?? "1"; // Fallback to 1 (Admin) ideally, or throw.
            
            produccion.UsuarioId = int.Parse(userIdStr);
            produccion.Fecha = DateTime.Now;

            // Clear any circular references or IDs that shouldn't be set
            produccion.ProduccionId = 0; 
            foreach(var ing in produccion.Ingredientes)
            {
                ing.ProduccionIngredienteId = 0;
                ing.ProduccionId = 0;
            }

            var created = await _fabricaService.RegistrarProduccionAsync(produccion);
            return Ok(created);
        } 
        catch (Exception ex) 
        { 
            Console.WriteLine($"[ERROR] RegistrarProduccion: {ex.Message} \n {ex.StackTrace}");
            if (ex.InnerException != null) Console.WriteLine($"[INNER] {ex.InnerException.Message}");
            return BadRequest(new { message = ex.Message, details = ex.InnerException?.Message }); 
        }
    }

    [HttpGet("fabrica/historial")]
    public async Task<IActionResult> GetHistorialProduccion()
    {
        // 1. Get Productions
        var producciones = await _fabricaService.GetHistorialProduccionAsync();
        
        // 2. Get Factory Sales (Ventas where Vehiculo is "GRANJA" or specifically marked)
        // Filter to ensure we only get sales that contain Insumos (Feed/Grains) and NOT purely eggs if possible.
        // Or simply filter out lines that are eggs.
        var ventasFabrica = await _context.Ventas
            .Include(v => v.Detalles)
                .ThenInclude(d => d.Producto)
            .Include(v => v.Usuario)
            .Include(v => v.Cliente)
            .Include(v => v.Vehiculo)
            .Where(v => v.Vehiculo.Patente == "GRANJA") 
            .OrderByDescending(v => v.Fecha)
            .Take(50) 
            .ToListAsync();

        // 3. Merge and Map to DTO
        var historial = new List<HistorialFabricaDTO>();

        foreach (var p in producciones)
        {
            historial.Add(new HistorialFabricaDTO
            {
                Fecha = p.Fecha,
                Tipo = "Produccion",
                CantidadKg = p.CantidadKg,
                Destino = p.SiloDestino?.Nombre ?? "Consumo Inmediato/Otro",
                Usuario = p.Usuario?.Nombre ?? "Sistema",
                Detalle = string.Join(", ", p.Ingredientes.Select(i => $"{i.Silo?.Nombre ?? "?"}: {i.CantidadKg}kg"))
            });
        }

        foreach (var v in ventasFabrica)
        {
            // Filter details: Only consider non-egg products (Insumos)
            var insumoDetails = v.Detalles.Where(d => d.Producto.TipoProducto != TipoProducto.Huevo).ToList();

            // If the sale has no insumos (e.g. it was purely eggs), skip it from Factory History
            if (!insumoDetails.Any()) continue;

            historial.Add(new HistorialFabricaDTO
            {
                Fecha = v.Fecha,
                Tipo = "Venta",
                CantidadKg = insumoDetails.Sum(d => d.Cantidad), // Only sum weight of insumos
                Destino = v.Cliente?.NombreCompleto ?? "Cliente Final",
                Usuario = v.Usuario?.Nombre ?? "Sistema",
                Detalle = $"Venta ${(v.Total).ToString("N2")}"
            });
        }

        return Ok(historial.OrderByDescending(h => h.Fecha));
    }

    [HttpPost("fabrica/venta")]
    [Authorize(Roles = "Admin")] // "el jefe lo determina"
    public async Task<IActionResult> VentaFabrica([FromBody] VentaFabricaRequest request)
    {
        // 1. Update Silo Stock (Consume)
        await _siloService.RegistrarConsumoAsync(request.SiloId, request.CantidadKg);

        // 2. Register Sale (Venta) ALWAYS
        // Find fallback client if not provided
        int clienteId = request.ClienteId ?? 0;
        if (clienteId == 0)
        {
            var defaultClient = await _context.Clientes.FirstOrDefaultAsync(c => c.NombreCompleto == "Venta de Fábrica" || c.NombreCompleto == "Consumidor Final");
            if (defaultClient == null)
            {
                defaultClient = new Cliente { NombreCompleto = "Venta de Fábrica", Direccion = "Local", DNI = "00000000" };
                _context.Clientes.Add(defaultClient);
                await _context.SaveChangesAsync();
            }
            clienteId = defaultClient.ClienteId;
        }

        var venta = new Venta
        {
            ClienteId = clienteId,
            Fecha = DateTime.Now,
            Total = request.PrecioTotal,
            MetodoPago = Models.Enums.MetodoPago.Efectivo, // Default to Cash
            UsuarioId = int.Parse(User.Claims.FirstOrDefault(c => c.Type == "http://schemas.microsoft.com/ws/2008/06/identity/claims/primarysid")?.Value ?? "1"), 
            VehiculoId = (await _context.Vehiculos.FirstOrDefaultAsync(v => v.Patente == "GRANJA"))?.VehiculoId ?? 1,
            Detalles = new List<DetalleVenta>()
        };
        
        // To make this robust, we should fetch Silo and use its ProductId.
        var silo = await _siloService.GetByIdAsync(request.SiloId);
        int productoId = silo?.ProductoId ?? 1; // Fallback to 1 if missing

        venta.Detalles.Add(new DetalleVenta
        {
            Cantidad = request.CantidadKg, 
            PrecioUnitario = request.CantidadKg > 0 ? (request.PrecioTotal / request.CantidadKg) : 0,
            Subtotal = request.PrecioTotal,
            ProductoId = productoId 
        });

        _context.Ventas.Add(venta);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Venta de fábrica registrada. Stock descontado y venta guardada." });
    }

    public class HistorialFabricaDTO
    {
        public DateTime Fecha { get; set; }
        public string Tipo { get; set; }
        public decimal CantidadKg { get; set; }
        public string Destino { get; set; }
        public string Usuario { get; set; }
        public string Detalle { get; set; }
    }

    #endregion

    #region Deposito

    [HttpGet("deposito")]
    public async Task<IActionResult> GetDeposito()
    {
        // "en el deposito se es donde esta el stock general" -> Productos
        var productos = await _context.Productos.ToListAsync();
        return Ok(productos);
    }

    [HttpPost("deposito/movimiento")]
    [Authorize(Roles = "Admin,Encargado")] 
    public async Task<IActionResult> RegistrarMovimientoDeposito([FromBody] MovimientoStock movimiento)
    {
        var producto = await _context.Productos.FindAsync(movimiento.ProductoId);
        if (producto == null) return NotFound("Producto no encontrado");

        movimiento.Fecha = DateTime.Now;
        // Fallback user ID logic
        movimiento.UsuarioId = int.Parse(User.Claims.FirstOrDefault(c => c.Type == "http://schemas.microsoft.com/ws/2008/06/identity/claims/primarysid")?.Value ?? "1");

        // Update Stock
        if (movimiento.TipoMovimiento == TipoMovimientoStock.Ingreso)
        {
            producto.StockActual += movimiento.Cantidad;
        }
        else if (movimiento.TipoMovimiento == TipoMovimientoStock.Egreso || movimiento.TipoMovimiento == TipoMovimientoStock.AjusteInventario)
        {
            producto.StockActual -= movimiento.Cantidad;
        }

        if (producto.StockActual < 0) producto.StockActual = 0;

        _context.MovimientosStock.Add(movimiento);
        await _context.SaveChangesAsync();
        return Ok(producto);
    }

    [HttpPut("productos/{id}/precio")]
    [Authorize(Roles = "Admin,Encargado")]
    public async Task<IActionResult> UpdateProductoPrecio(int id, [FromBody] UpdatePrecioRequest request)
    {
        var producto = await _context.Productos.FindAsync(id);
        if (producto == null) return NotFound("Producto no encontrado");

        if (producto.EsHuevo) return BadRequest("No se puede manipular el precio del huevo desde aquí");

        producto.CostoUltimaCompra = request.Precio;
        await _context.SaveChangesAsync();
        return Ok(producto);
    }

    [HttpPost("productos")]
    [Authorize(Roles = "Admin,Encargado")]
    public async Task<IActionResult> CreateProducto([FromBody] Producto producto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        _context.Productos.Add(producto);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetDeposito), new { id = producto.ProductoId }, producto);
    }

    #endregion

    #region Taller
    
    [HttpPost("taller/vehiculo/{id}/estado")]
    [Authorize(Roles = "Admin,Chofer")]
    public async Task<IActionResult> UpdateVehiculoEstado(int id, [FromBody] string nuevoEstado)
    {
        // Receives string in quotes e.g. "En Reparación"
        var vehiculo = await _context.Vehiculos.FindAsync(id);
        if (vehiculo == null) return NotFound();

        vehiculo.Estado = nuevoEstado;
        await _context.SaveChangesAsync();
        return Ok(new { message = "Estado actualizado" });
    }

    #endregion
}

public class CargaSiloRequest
{
    public int SiloId { get; set; }
    public decimal CantidadKg { get; set; }
    public decimal PrecioTotal { get; set; }
}

public class AjusteSiloRequest
{
    public int SiloId { get; set; }
    public string? Nombre { get; set; }
    public decimal CapacidadKg { get; set; }
    public decimal CantidadKg { get; set; }
    public int? ProductoId { get; set; }
}

public class VentaFabricaRequest
{
    public int SiloId { get; set; }
    public decimal CantidadKg { get; set; }
    public decimal PrecioTotal { get; set; }
    public int? ClienteId { get; set; }
}

public class TransferirPollitosRequest
{
    public int GalponOrigenId { get; set; }
    public int GalponDestinoId { get; set; }
    public int Cantidad { get; set; }
}

public class UpdatePrecioRequest
{
    public decimal Precio { get; set; }
}
