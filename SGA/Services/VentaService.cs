using Microsoft.EntityFrameworkCore;
using SGA.Data;
using SGA.Models;
using SGA.Models.DTOs;
using SGA.Models.Enums;
using SGA.Helpers;

namespace SGA.Services;

public class VentaService : IVentaService
{
    private readonly AppDbContext _context;
    private readonly INotificacionService _notificacionService;
    private readonly IViajeService _viajeService;

    public VentaService(AppDbContext context, INotificacionService notificacionService, IViajeService viajeService)
    {
        _context = context;
        _notificacionService = notificacionService;
        _viajeService = viajeService;
    }

    public async Task<Venta> RegistrarVentaAsync(RegistrarVentaRequest request)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 1. Validaciones Previas
            var usuario = await _context.Usuarios.FindAsync(request.UsuarioId);
            if (usuario == null) throw new KeyNotFoundException("Usuario no encontrado.");

            if (usuario.Rol == RolUsuario.Chofer)
            {
                var viajeActivo = await _viajeService.ObtenerViajeActivoPorUsuarioAsync(request.UsuarioId);
                // Debe tener viaje activo Y coincidir con vehículo
                if (viajeActivo == null)
                    throw new InvalidOperationException("No tienes un viaje activo autorizado. Solicita autorización al administrador.");
                
                if (viajeActivo.VehiculoId != request.VehiculoId)
                    throw new InvalidOperationException($"Tu viaje activo es con el vehículo patente {viajeActivo.Vehiculo?.Patente} ({viajeActivo.VehiculoId}), no con el vehículo {request.VehiculoId}.");
            }

            // 2. Crear la Venta
            var venta = new Venta
            {
                Fecha = request.Fecha ?? TimeHelper.Now,
                ClienteId = request.ClienteId,
                UsuarioId = request.UsuarioId,
                VehiculoId = request.VehiculoId,
                MetodoPago = request.MetodoPago,
                DescuentoPorcentaje = request.DescuentoPorcentaje,
                FechaVencimientoPago = request.FechaVencimientoPago,
                Activa = true,
                Total = 0 // Se calcula abajo
            };

            _context.Ventas.Add(venta);
            await _context.SaveChangesAsync(); // Para obtener el ID

            decimal totalVenta = 0;
            var detallesTexto = new List<string>();

            foreach (var item in request.Items)
            {
                // 2. Validar Stock
                var stockVehiculo = await _context.StockVehiculos
                    .Include(s => s.Producto)
                    .FirstOrDefaultAsync(s => s.VehiculoId == request.VehiculoId && s.ProductoId == item.ProductoId);

                if (stockVehiculo == null || stockVehiculo.Cantidad < item.Cantidad)
                {
                    throw new InvalidOperationException($"Stock insuficiente para el producto ID {item.ProductoId} en el vehículo.");
                }

                // Recolectar info para notificación
                if (stockVehiculo.Producto != null)
                {
                    detallesTexto.Add($"{item.Cantidad} {stockVehiculo.Producto.UnidadDeMedida} de {stockVehiculo.Producto.Nombre}");
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
                stockVehiculo.UltimaActualizacion = TimeHelper.Now;

                // 5. Registrar Movimiento de Stock (Auditoría)
                var movimiento = new MovimientoStock
                {
                    Fecha = TimeHelper.Now,
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

            // Actualizar información del cliente
            var clienteUpdate = await _context.Clientes.FindAsync(request.ClienteId);
            if (clienteUpdate != null)
            {
                clienteUpdate.VentasTotales += venta.Total;
                clienteUpdate.UltimaCompra = venta.Fecha;

                if (request.MetodoPago == MetodoPago.CuentaCorriente)
                {
                    clienteUpdate.Deuda += venta.Total;
                }
            }

            await _context.SaveChangesAsync();

            // Registrar Notificación y Auditoría
            try
            {
                await _notificacionService.RegistrarAccionAsync(
                    "Registrar Venta", 
                    "Venta", 
                    venta.VentaId.ToString(), 
                    request.UsuarioId, 
                    $"Venta registrada por ${venta.Total} (Desc: {venta.DescuentoPorcentaje}%)"
                );

                // Obtener Nombres para el mensaje detallado
                // Obtener Nombres para el mensaje detallado
                // var usuario already exists from line 29
                var cliente = await _context.Clientes.FindAsync(request.ClienteId);

                var nombreUsuario = usuario?.Nombre ?? "Usuario Desconocido";
                var nombreCliente = cliente?.NombreCompleto ?? "Cliente Desconocido";
                var listaProductos = string.Join(", ", detallesTexto);

                var mensajeNotificacion = $"{nombreUsuario} vendió {listaProductos} a {nombreCliente}, por el valor de ${venta.Total}";

                await _notificacionService.CrearNotificacionAsync(
                    mensajeNotificacion,
                    "Venta", 
                    request.UsuarioId
                );
            }
            catch (Exception ex)
            {
                // Log warning but don't fail the transaction just for notification
                Console.WriteLine($"[WARNING] Failed to create notification: {ex.Message}");
            }

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

    public async Task<List<HistorialVentaDTO>> ObtenerVentasPorClienteAsync(int clienteId)
    {
        return await _context.Ventas
            .Where(v => v.ClienteId == clienteId)
            .Include(v => v.Usuario)
            .Include(v => v.Detalles)
                .ThenInclude(d => d.Producto)
            .OrderByDescending(v => v.Fecha)
            .Select(v => new HistorialVentaDTO
            {
                VentaId = v.VentaId,
                Fecha = v.Fecha.ToString("yyyy-MM-dd HH:mm"),
                Total = v.Total,
                MetodoPago = v.MetodoPago.ToString(),
                Vendedor = v.Usuario != null ? v.Usuario.Nombre : "Desconocido",
                Productos = v.Detalles.Select(d => new DetalleVentaHistorialDTO
                {
                    Producto = d.Producto != null ? d.Producto.Nombre : "Desconocido",
                    Cantidad = d.Cantidad,
                    PrecioUnitario = d.PrecioUnitario,
                    Subtotal = d.Subtotal
                }).ToList()
            })
            .ToListAsync();
    }

    public async Task CancelarVentaAsync(int ventaId, string motivo)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var venta = await _context.Ventas
                .Include(v => v.Detalles)
                .Include(v => v.Cliente)
                .FirstOrDefaultAsync(v => v.VentaId == ventaId);

            if (venta == null) throw new KeyNotFoundException("Venta no encontrada");
            if (!venta.Activa) throw new InvalidOperationException("La venta ya está anulada.");

            // 1. Marcar como inactiva
            venta.Activa = false;

            // 2. Revertir Cliente
            if (venta.Cliente != null)
            {
                venta.Cliente.VentasTotales -= venta.Total;
                
                if (venta.MetodoPago == MetodoPago.CuentaCorriente)
                {
                    venta.Cliente.Deuda -= venta.Total;
                }
            }

            // 3. Revertir Stock
            foreach (var detalle in venta.Detalles)
            {
                var stockVehiculo = await _context.StockVehiculos
                    .FirstOrDefaultAsync(s => s.VehiculoId == venta.VehiculoId && s.ProductoId == detalle.ProductoId);
                
                if (stockVehiculo != null)
                {
                    stockVehiculo.Cantidad += detalle.Cantidad; // Devolver stock
                    stockVehiculo.UltimaActualizacion = TimeHelper.Now;
                }

                // Registrar Movimiento de Ajuste
                var movimiento = new MovimientoStock
                {
                    Fecha = TimeHelper.Now,
                    TipoMovimiento = TipoMovimientoStock.DevolucionCliente,
                    VehiculoId = venta.VehiculoId,
                    ProductoId = detalle.ProductoId,
                    Cantidad = detalle.Cantidad, // Entrada
                    UsuarioId = venta.UsuarioId,
                    Observaciones = $"Anulación Venta #{venta.VentaId}: {motivo}"
                };
                _context.MovimientosStock.Add(movimiento);
            }

            // Registrar Acción de Auditoría
            await _notificacionService.RegistrarAccionAsync(
                "Anular Venta", 
                "Venta", 
                venta.VentaId.ToString(), 
                venta.UsuarioId, 
                $"Venta anulada. Motivo: {motivo}"
            );

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
