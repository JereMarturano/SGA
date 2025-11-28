using Microsoft.EntityFrameworkCore;
using SGA.Data;
using SGA.Models;
using SGA.Models.DTOs;
using SGA.Models.Enums;

namespace SGA.Services;

public class VentaService : IVentaService
{
    private readonly AppDbContext _context;

    public VentaService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Venta> RegistrarVentaAsync(RegistrarVentaRequest request)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 1. Crear la Venta
            var venta = new Venta
            {
                Fecha = DateTime.UtcNow,
                ClienteId = request.ClienteId,
                UsuarioId = request.UsuarioId,
                VehiculoId = request.VehiculoId,
                MetodoPago = request.MetodoPago,
                Total = 0 // Se calcula abajo
            };

            _context.Ventas.Add(venta);
            await _context.SaveChangesAsync(); // Para obtener el ID

            decimal totalVenta = 0;

            foreach (var item in request.Items)
            {
                // 2. Validar Stock
                var stockVehiculo = await _context.StockVehiculos
                    .FirstOrDefaultAsync(s => s.VehiculoId == request.VehiculoId && s.ProductoId == item.ProductoId);

                if (stockVehiculo == null || stockVehiculo.Cantidad < item.Cantidad)
                {
                    throw new InvalidOperationException($"Stock insuficiente para el producto ID {item.ProductoId} en el vehículo.");
                }

                // 3. Crear Detalle de Venta
                var detalle = new DetalleVenta
                {
                    VentaId = venta.VentaId,
                    ProductoId = item.ProductoId,
                    Cantidad = item.Cantidad,
                    PrecioUnitario = item.PrecioUnitario,
                    Subtotal = item.Cantidad * item.PrecioUnitario
                };
                _context.DetallesVenta.Add(detalle);

                totalVenta += detalle.Subtotal;

                // 4. Descontar Stock
                stockVehiculo.Cantidad -= item.Cantidad;
                stockVehiculo.UltimaActualizacion = DateTime.UtcNow;

                // 5. Registrar Movimiento de Stock (Auditoría)
                var movimiento = new MovimientoStock
                {
                    Fecha = DateTime.UtcNow,
                    TipoMovimiento = TipoMovimientoStock.Venta,
                    VehiculoId = request.VehiculoId,
                    ProductoId = item.ProductoId,
                    Cantidad = -item.Cantidad, // Salida
                    UsuarioId = request.UsuarioId,
                    Observaciones = $"Venta #{venta.VentaId}"
                };
                _context.MovimientosStock.Add(movimiento);
            }

            // Actualizar total de la venta
            venta.Total = totalVenta;
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return venta;
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<Venta?> ObtenerVentaPorIdAsync(int id)
    {
        return await _context.Ventas
            .Include(v => v.Cliente)
            .Include(v => v.Usuario)
            .Include(v => v.Vehiculo)
            .Include(v => v.Detalles)
                .ThenInclude(d => d.Producto)
            .FirstOrDefaultAsync(v => v.VentaId == id);
    }

    public async Task<List<Venta>> ObtenerVentasPorVehiculoYFechaAsync(int vehiculoId, DateTime fecha)
    {
        // Filtramos por día completo
        var fechaInicio = fecha.Date;
        var fechaFin = fechaInicio.AddDays(1);

        return await _context.Ventas
            .Include(v => v.Cliente)
            .Include(v => v.Detalles)
            .Where(v => v.VehiculoId == vehiculoId && v.Fecha >= fechaInicio && v.Fecha < fechaFin)
            .OrderByDescending(v => v.Fecha)
            .ToListAsync();
    }
}
