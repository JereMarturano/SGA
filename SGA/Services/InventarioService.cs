using Microsoft.EntityFrameworkCore;
using SGA.Data;
using SGA.Models;
using SGA.Models.Enums;
using SGA.Models.DTOs;

namespace SGA.Services;

public class InventarioService : IInventarioService
{
    private readonly AppDbContext _context;

    public InventarioService(AppDbContext context)
    {
        _context = context;
    }

    public async Task CargarVehiculoAsync(int vehiculoId, List<(int ProductoId, decimal Cantidad)> items, int usuarioId, int? choferId = null)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var fechaHora = DateTime.UtcNow;
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
                    Fecha = fechaHora,
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
                        UltimaActualizacion = fechaHora
                    };
                    _context.StockVehiculos.Add(stockVehiculo);
                }

                stockVehiculo.Cantidad += item.Cantidad;
                stockVehiculo.UltimaActualizacion = fechaHora;
            }

            // 4. Actualizar estado del vehículo a "En Reparto" y asignar chofer
            var vehiculo = await _context.Vehiculos.FindAsync(vehiculoId);
            if (vehiculo != null)
            {
                vehiculo.EnRuta = true;
                if (choferId.HasValue)
                {
                    vehiculo.ID_Chofer_Asignado = choferId.Value;
                }
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

    public async Task CerrarRepartoAsync(CerrarRepartoRequest request)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var vehiculo = await _context.Vehiculos.FindAsync(request.VehiculoId);
            if (vehiculo == null) throw new Exception("Vehículo no encontrado");

            if (!vehiculo.EnRuta) throw new Exception("El vehículo no está marcado como En Ruta");

            // Validar Kilometraje
            if (request.NuevoKilometraje < vehiculo.Kilometraje)
            {
                throw new Exception($"El nuevo kilometraje ({request.NuevoKilometraje}) no puede ser menor al actual ({vehiculo.Kilometraje}).");
            }

            // 1. Actualizar Vehículo
            vehiculo.EnRuta = false;
            vehiculo.ID_Chofer_Asignado = null; // Liberar chofer
            vehiculo.Kilometraje = request.NuevoKilometraje;

            // 2. Procesar Stock
            // Obtenemos TODO el stock del vehículo para asegurar que no quede nada "huerfano" si el request viene incompleto
            var stocksVehiculo = await _context.StockVehiculos
                .Include(s => s.Producto)
                .Where(s => s.VehiculoId == request.VehiculoId)
                .ToListAsync();

            // Mapa de input para acceso rápido
            var inputMap = request.StockRetorno.ToDictionary(x => x.ProductoId, x => x.CantidadFisica);

            // 2.1 Procesar lo que estaba en el vehículo
            foreach (var stockVehiculo in stocksVehiculo)
            {
                var stockTeorico = stockVehiculo.Cantidad;

                // Si el request no incluye este producto, asumimos que físicamente es 0 (se perdió todo? o error de UI?)
                // Para seguridad, asumimos 0 si no viene, o mejor, asumimos que es igual al teórico si no se reporta?
                // Dado que es un "Cierre de Caja", se DEBE contar todo. Si no está en la lista, es 0 físico.
                decimal stockFisico = 0;
                if (inputMap.TryGetValue(stockVehiculo.ProductoId, out var val))
                {
                    stockFisico = val;
                    // Removemos del mapa para saber qué sobró en el input
                    inputMap.Remove(stockVehiculo.ProductoId);
                }

                var diferencia = stockFisico - stockTeorico;

                // 2a. Registrar diferencias
                if (diferencia != 0)
                {
                    var tipoMov = diferencia < 0 ? TipoMovimientoStock.Merma : TipoMovimientoStock.AjusteInventario;
                    var movDiff = new MovimientoStock
                    {
                        Fecha = DateTime.UtcNow,
                        TipoMovimiento = tipoMov,
                        VehiculoId = request.VehiculoId,
                        ProductoId = stockVehiculo.ProductoId,
                        Cantidad = diferencia,
                        UsuarioId = request.UsuarioId,
                        Observaciones = diferencia < 0
                            ? $"Cierre Reparto - Faltante/Merma detectado (Teórico: {stockTeorico}, Físico: {stockFisico})"
                            : $"Cierre Reparto - Sobrante detectado (Teórico: {stockTeorico}, Físico: {stockFisico})"
                    };
                    _context.MovimientosStock.Add(movDiff);
                }

                // 2b. Devolver Stock Físico al Depósito (Descarga Final)
                if (stockFisico > 0)
                {
                    // Asumiendo que Include trajo el producto
                    if (stockVehiculo.Producto != null)
                    {
                        stockVehiculo.Producto.StockActual += stockFisico;
                    }
                    else
                    {
                        // Fallback por seguridad si EF no trajo el producto (raro con Include)
                         var prod = await _context.Productos.FindAsync(stockVehiculo.ProductoId);
                         if (prod != null) prod.StockActual += stockFisico;
                    }

                    var movDescarga = new MovimientoStock
                    {
                        Fecha = DateTime.UtcNow,
                        TipoMovimiento = TipoMovimientoStock.DescargaFinal,
                        VehiculoId = request.VehiculoId,
                        ProductoId = stockVehiculo.ProductoId,
                        Cantidad = stockFisico,
                        UsuarioId = request.UsuarioId,
                        Observaciones = "Cierre Reparto - Retorno a Depósito"
                    };
                    _context.MovimientosStock.Add(movDescarga);
                }

                // 2c. Limpiar Stock Vehículo
                stockVehiculo.Cantidad = 0;
                stockVehiculo.UltimaActualizacion = DateTime.UtcNow;
            }

            // 2.2 Procesar items que vienen en el request pero NO estaban en el vehículo (Sobrantes puros)
            foreach (var item in inputMap)
            {
                var productoId = item.Key;
                var cantidadFisica = item.Value;

                if (cantidadFisica > 0)
                {
                     var prod = await _context.Productos.FindAsync(productoId);
                     if (prod != null)
                     {
                        prod.StockActual += cantidadFisica;

                        var movSobrante = new MovimientoStock
                        {
                            Fecha = DateTime.UtcNow,
                            TipoMovimiento = TipoMovimientoStock.AjusteInventario,
                            VehiculoId = request.VehiculoId,
                            ProductoId = productoId,
                            Cantidad = cantidadFisica,
                            UsuarioId = request.UsuarioId,
                            Observaciones = "Cierre de Reparto - Sobrante (No existía en sistema)"
                        };
                        _context.MovimientosStock.Add(movSobrante);
                     }
                }
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
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
                
                // Actualizar Costo de Última Compra (por unidad)
                producto.CostoUltimaCompra = item.CostoUnitario;

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

    public async Task<List<MovimientoStock>> ObtenerHistorialCargasAsync()
    {
        var now = DateTime.UtcNow;
        // Calculate start of the week (Monday)
        int diff = (7 + (now.DayOfWeek - DayOfWeek.Monday)) % 7;
        var startOfWeek = now.Date.AddDays(-1 * diff);

        return await _context.MovimientosStock
            .Include(m => m.Vehiculo)
            .Include(m => m.Producto)
            .Where(m => m.TipoMovimiento == TipoMovimientoStock.CargaInicial && m.Fecha >= startOfWeek)
            .OrderByDescending(m => m.Fecha)
            .ToListAsync();
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
