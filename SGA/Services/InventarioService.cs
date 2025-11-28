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
                // 1. Registrar el Movimiento (Auditoría)
                var movimiento = new MovimientoStock
                {
                    Fecha = DateTime.UtcNow,
                    TipoMovimiento = TipoMovimientoStock.CargaInicial, // Asumimos carga, podría ser Recarga según lógica de negocio
                    VehiculoId = vehiculoId,
                    ProductoId = item.ProductoId,
                    Cantidad = item.Cantidad,
                    UsuarioId = usuarioId,
                    Observaciones = "Carga de vehículo por Administrador"
                };
                _context.MovimientosStock.Add(movimiento);

                // 2. Actualizar el Stock Físico en el Vehículo
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
