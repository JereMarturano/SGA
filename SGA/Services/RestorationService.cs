using Microsoft.EntityFrameworkCore;
using SGA.Data;
using SGA.Models;
using SGA.Models.Enums;

namespace SGA.Services;

public class RestorationService : IRestorationService
{
    private readonly AppDbContext _context;
    private readonly IVentaService _ventaService;
    private readonly IViajeService _viajeService;

    public RestorationService(AppDbContext context, IVentaService ventaService, IViajeService viajeService)
    {
        _context = context;
        _ventaService = ventaService;
        _viajeService = viajeService;
    }

    public async Task RevertirAccionesUsuarioAsync(int usuarioId, DateTime? desde, string motivo)
    {
        var fechaInicio = desde ?? DateTime.MinValue;

        // 1. Revertir Ventas
        var ventas = await _context.Ventas
            .Where(v => v.UsuarioId == usuarioId && v.Fecha >= fechaInicio && v.Activa)
            .ToListAsync();

        foreach (var venta in ventas)
        {
             await _ventaService.CancelarVentaAsync(venta.VentaId, $"RESTAURACIÓN MASIVA: {motivo}");
        }

        // 2. Cerrar Viajes forzosamente
        var viajes = await _context.Viajes
            .Where(v => v.ChoferId == usuarioId && v.FechaSalida >= fechaInicio && v.Estado == EstadoViaje.EnCurso)
            .ToListAsync();

        foreach (var viaje in viajes)
        {
            await _viajeService.FinalizarViajeAsync(viaje.ViajeId, $"RESTAURACIÓN MASIVA: {motivo}");
        }

        // 3. Registrar en Historial
        // (Esto ya se hace parcialmente en los servicios individuales, pero podemos agregar una entrada general)
    }

    public async Task HardResetAsync()
    {
        // TRUNCATE or DELETE all transactional tables
        // Order matters for foreign keys if we don't disable constraints.
        // Easiest is to delete.
        
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
             // 1. Detalle Venta & Venta
             _context.DetallesVenta.RemoveRange(_context.DetallesVenta);
             _context.Ventas.RemoveRange(_context.Ventas);
             
             // 2. Detalle Compra & Compra
             _context.DetallesCompra.RemoveRange(_context.DetallesCompra);
             _context.Compras.RemoveRange(_context.Compras);
             
             // 3. Movimientos Stock
             _context.MovimientosStock.RemoveRange(_context.MovimientosStock);
             
             // 4. Stock Vehiculos (Reset to 0 or Delete?) -> Reset to 0 seems safer for pre-assigned vehicles, or Delete.
             // If we delete, they will be re-created on load. Let's delete for clean slate.
             _context.StockVehiculos.RemoveRange(_context.StockVehiculos);
             
             // 5. Gastos
             _context.GastosVehiculos.RemoveRange(_context.GastosVehiculos);
             
             // 6. Viajes
             _context.Viajes.RemoveRange(_context.Viajes);
             
             // 7. Cierres Caja
             _context.CierresCajaDiarios.RemoveRange(_context.CierresCajaDiarios);
             
             // 8. Pagos & Deuda Clientes
             _context.Pagos.RemoveRange(_context.Pagos);
             
             // 9. Reset Client Debt/Stats
             var clientes = await _context.Clientes.ToListAsync();
             foreach(var c in clientes)
             {
                 c.Deuda = 0;
                 c.VentasTotales = 0;
                 c.UltimaCompra = null;
             }
             
             // 10. Reset Product Stock/Costs
             var productos = await _context.Productos.ToListAsync();
             foreach(var p in productos)
             {
                 p.StockActual = 0;
                 p.CostoUltimaCompra = 0; // Reset cost? Or keep it? User said "start numbers from 0".
                 // "lleves todos los numeros a 0... para volver a empezar".
                 // Usually you keep the cost catalog, but technically if starting over, maybe cost should be 0 until first purchase?
                 // Let's reset Stock to 0. Cost is tricky. Let's reset it to 0 as requested "numeros a 0".
                 p.CostoUltimaCompra = 0;
             }
             
             // 11. Reset Vehicle Status
             var vehiculos = await _context.Vehiculos.ToListAsync();
             foreach(var v in vehiculos)
             {
                 v.EnRuta = false;
                 // v.Kilometraje = 0; // Maybe not mileage? Mileage is physical. Let's keep mileage or reset?
                 // Usually you don't reset mileage on a software reset unless it's a new fleet. 
                 // User said "numeros a 0". Let's assume transactional numbers. Mileage is physical state.
                 // But "EnRuta" is transactional state.
                 v.ID_Chofer_Asignado = null;
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
}
