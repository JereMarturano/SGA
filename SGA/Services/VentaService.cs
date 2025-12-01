using Microsoft.EntityFrameworkCore;
using SGA.Data;
using SGA.Models;
using SGA.Models.DTOs;
using SGA.Models.Enums;

namespace SGA.Services;

public class VentaService : IVentaService
{
    private readonly AppDbContext _context;
    private readonly INotificacionService _notificacionService;

    public VentaService(AppDbContext context, INotificacionService notificacionService)
    {
        _context = context;
        _notificacionService = notificacionService;
    }

    public async Task<Venta> RegistrarVentaAsync(RegistrarVentaRequest request)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 1. Crear la Venta
            var venta = new Venta
            {
                Fecha = request.Fecha ?? DateTime.UtcNow,
                ClienteId = request.ClienteId,
                UsuarioId = request.UsuarioId,
                VehiculoId = request.VehiculoId,
                MetodoPago = request.MetodoPago,
                DescuentoPorcentaje = request.DescuentoPorcentaje,
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

            // Calcular descuentos
            decimal descuentoMonto = 0;
            if (venta.DescuentoPorcentaje > 0)
            {
                descuentoMonto = totalVenta * (venta.DescuentoPorcentaje / 100);
            }
            venta.DescuentoMonto = descuentoMonto;

            // Actualizar total de la venta
            venta.Total = totalVenta - descuentoMonto;
            await _context.SaveChangesAsync();

            // Registrar Notificación y Auditoría
            await _notificacionService.RegistrarAccionAsync(
                "Registrar Venta", 
                "Venta", 
                venta.VentaId.ToString(), 
                request.UsuarioId, 
                $"Venta registrada por ${venta.Total} (Desc: {venta.DescuentoPorcentaje}%)"
            );

            await _notificacionService.CrearNotificacionAsync(
                $"Nueva venta registrada por ${venta.Total}",
                "Venta", 
                request.UsuarioId
            );

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
