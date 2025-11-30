using Microsoft.EntityFrameworkCore;
using SGA.Data;
using SGA.Models;
using SGA.Models.Enums;

namespace SGA.Services;

public class InventarioService : IInventarioService
{
    private readonly AppDbContext _context;

    public InventarioService(AppDbContext context)
    {
        _context = context;
    }

    public async Task CargarVehiculoAsync(int vehiculoId, List<(int ProductoId, decimal Cantidad)> items, int usuarioId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            foreach (var item in items)
            {
                // 0. Validar Stock General
                var producto = await _context.Productos.FindAsync(item.ProductoId);
                if (producto == null) throw new Exception($"Producto {item.ProductoId} no encontrado");
                
                if (producto.StockActual < item.Cantidad)
                {
                    throw new Exception($"Stock insuficiente en depósito para el producto {producto.Nombre}. Disponible: {producto.StockActual}, Solicitado: {item.Cantidad}");
                }

                // 1. Descontar del Stock General (Depósito)
                producto.StockActual -= item.Cantidad;

                // 2. Registrar el Movimiento (Auditoría) - Salida de Depósito a Vehículo
                var movimiento = new MovimientoStock
                {
                    Fecha = DateTime.UtcNow,
                    TipoMovimiento = TipoMovimientoStock.CargaInicial, 
                    VehiculoId = vehiculoId,
                    ProductoId = item.ProductoId,
                    Cantidad = item.Cantidad,
                    UsuarioId = usuarioId,
                    Observaciones = "Carga de vehículo desde Depósito Central"
                };
                _context.MovimientosStock.Add(movimiento);

                // 3. Actualizar el Stock Físico en el Vehículo
                var stockVehiculo = await _context.StockVehiculos
                    .FirstOrDefaultAsync(s => s.VehiculoId == vehiculoId && s.ProductoId == item.ProductoId);

                if (stockVehiculo == null)
                {
                    stockVehiculo = new StockVehiculo
                    {
                        VehiculoId = vehiculoId,
                        ProductoId = item.ProductoId,
                        Cantidad = 0,
                        UltimaActualizacion = DateTime.UtcNow
                    };
                    _context.StockVehiculos.Add(stockVehiculo);
                }

                stockVehiculo.Cantidad += item.Cantidad;
                stockVehiculo.UltimaActualizacion = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task RegistrarCompraAsync(CompraRequest request)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var compra = new Compra
            {
                Fecha = DateTime.UtcNow,
                UsuarioId = request.UsuarioId,
                Proveedor = request.Proveedor,
                Observaciones = request.Observaciones,
                Total = 0
            };

            _context.Compras.Add(compra);
            await _context.SaveChangesAsync();

            decimal totalCompra = 0;

            foreach (var item in request.Items)
            {
                var producto = await _context.Productos.FindAsync(item.ProductoId);
                if (producto == null) throw new Exception($"Producto {item.ProductoId} no encontrado");

                // 1. Aumentar Stock General
                producto.StockActual += item.Cantidad;

                // 2. Registrar Detalle Compra
                var detalle = new DetalleCompra
                {
                    CompraId = compra.CompraId,
                    ProductoId = item.ProductoId,
                    Cantidad = item.Cantidad,
                    CostoUnitario = item.CostoUnitario,
                    Subtotal = item.Cantidad * item.CostoUnitario
                };
                _context.DetallesCompra.Add(detalle);
                totalCompra += detalle.Subtotal;

                // 3. Registrar Movimiento (Ingreso por Compra)
                var movimiento = new MovimientoStock
                {
                    Fecha = DateTime.UtcNow,
                    TipoMovimiento = TipoMovimientoStock.AjusteInventario, // Usamos AjusteInventario o creamos uno nuevo Compra
                    ProductoId = item.ProductoId,
                    Cantidad = item.Cantidad,
                    UsuarioId = request.UsuarioId,
                    Observaciones = $"Compra #{compra.CompraId} - {request.Observaciones}"
                };
                _context.MovimientosStock.Add(movimiento);
            }

            compra.Total = totalCompra;
            
            // Generar Comprobante (Simulado por ahora como un archivo de texto)
            var comprobantePath = await GenerarComprobanteAsync(compra, request.Items);
            compra.ComprobantePath = comprobantePath;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    private async Task<string> GenerarComprobanteAsync(Compra compra, List<ItemCompra> items)
    {
        // Crear directorio si no existe
        var folderPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "comprobantes");
        if (!Directory.Exists(folderPath))
        {
            Directory.CreateDirectory(folderPath);
        }

        var fileName = $"compra_{compra.CompraId}_{DateTime.UtcNow:yyyyMMddHHmmss}.txt";
        var filePath = Path.Combine(folderPath, fileName);

        var sb = new System.Text.StringBuilder();
        sb.AppendLine("=== COMPROBANTE DE COMPRA ===");
        sb.AppendLine($"ID Compra: {compra.CompraId}");
        sb.AppendLine($"Fecha: {compra.Fecha}");
        sb.AppendLine($"Proveedor: {compra.Proveedor ?? "N/A"}");
        sb.AppendLine($"Usuario ID: {compra.UsuarioId}");
        sb.AppendLine("-----------------------------");
        sb.AppendLine("DETALLE:");
        
        foreach (var item in items)
        {
            // Necesitamos el nombre del producto, pero en el item solo tenemos ID.
            // Podríamos buscarlo de nuevo o pasarlo. Para simplificar, solo ponemos ID y montos.
            sb.AppendLine($"Producto ID: {item.ProductoId} | Cant: {item.Cantidad} | Costo U.: {item.CostoUnitario:C} | Subtotal: {(item.Cantidad * item.CostoUnitario):C}");
        }
        
        sb.AppendLine("-----------------------------");
        sb.AppendLine($"TOTAL: {compra.Total:C}");
        sb.AppendLine("=============================");

        await File.WriteAllTextAsync(filePath, sb.ToString());

        // Retornar URL relativa para acceso web
        return $"/comprobantes/{fileName}";
    }

    public async Task<List<StockVehiculo>> ObtenerStockVehiculoAsync(int vehiculoId)
    {
        return await _context.StockVehiculos
            .Include(s => s.Producto)
            .Where(s => s.VehiculoId == vehiculoId)
            .ToListAsync();
    }

    public async Task RegistrarMermaAsync(int vehiculoId, int productoId, decimal cantidad, int usuarioId, string motivo)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 1. Registrar Movimiento (Negativo porque es pérdida)
            var movimiento = new MovimientoStock
            {
                Fecha = DateTime.UtcNow,
                TipoMovimiento = TipoMovimientoStock.Merma,
                VehiculoId = vehiculoId,
                ProductoId = productoId,
                Cantidad = -cantidad, // Resta del stock
                UsuarioId = usuarioId,
                Observaciones = motivo
            };
            _context.MovimientosStock.Add(movimiento);

            // 2. Descontar del Stock del Vehículo
            var stockVehiculo = await _context.StockVehiculos
                .FirstOrDefaultAsync(s => s.VehiculoId == vehiculoId && s.ProductoId == productoId);

            if (stockVehiculo != null)
            {
                stockVehiculo.Cantidad -= cantidad;
                stockVehiculo.UltimaActualizacion = DateTime.UtcNow;
            }
            // Si no hay stock, técnicamente no podrías tener merma, pero permitimos que quede en negativo o lanzamos error según regla de negocio.
            // Por ahora permitimos que baje (podría indicar error de conteo previo).

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
