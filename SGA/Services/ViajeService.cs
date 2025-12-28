using Microsoft.EntityFrameworkCore;
using SGA.Data;
using SGA.Helpers;
using SGA.Models;
using SGA.Models.Enums;
using SGA.Models.DTOs;

namespace SGA.Services;

public class ViajeService : IViajeService
{
    private readonly AppDbContext _context;

    public ViajeService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Viaje> IniciarViajeAsync(int vehiculoId, int choferId, int? acompananteId, string? observaciones)
    {
        // Validar si el vehículo está en uso
        var vehiculo = await _context.Vehiculos.FindAsync(vehiculoId);
        if (vehiculo == null) throw new KeyNotFoundException("Vehículo no encontrado");
        if (vehiculo.EnRuta) 
        {
            // Verify if it's really in use or just stale state
            var activeTrip = await _context.Viajes.AnyAsync(v => v.VehiculoId == vehiculoId && v.Estado == EstadoViaje.EnCurso);
            if (activeTrip) 
            {
                throw new InvalidOperationException("El vehículo ya está en ruta con un viaje activo.");
            }
            // If stale (EnRuta=true but no active trip), we allow proceeding and overwrite.
        }

        // Validar si el chofer ya tiene viaje activo
        var existingTrip = await _context.Viajes
            .AnyAsync(v => (v.ChoferId == choferId || v.AcompananteId == choferId) && v.Estado == EstadoViaje.EnCurso);
        if (existingTrip) throw new InvalidOperationException("El chofer ya tiene un viaje activo.");

        // Validar si el acompañante ya tiene viaje activo
        if (acompananteId.HasValue)
        {
            var existingTripAcompanante = await _context.Viajes
                .AnyAsync(v => (v.ChoferId == acompananteId || v.AcompananteId == acompananteId) && v.Estado == EstadoViaje.EnCurso);
            if (existingTripAcompanante) throw new InvalidOperationException("El acompañante ya tiene un viaje activo.");

            // Validar si el acompañante está activo
            var acompanante = await _context.Usuarios.FindAsync(acompananteId);
            if (acompanante == null) throw new KeyNotFoundException("Acompañante no encontrado");
            if (acompanante.Estado != "Activo") throw new InvalidOperationException("El acompañante no está activo.");
        }

        // Validar si el chofer está activo
        var chofer = await _context.Usuarios.FindAsync(choferId);
        if (chofer == null) throw new KeyNotFoundException("Chofer no encontrado");
        if (chofer.Estado != "Activo") throw new InvalidOperationException("El chofer no está activo y no se le puede asignar un viaje.");

        var viaje = new Viaje
        {
            VehiculoId = vehiculoId,
            ChoferId = choferId,
            AcompananteId = acompananteId,
            FechaSalida = TimeHelper.Now,
            Estado = EstadoViaje.EnCurso,
            Observaciones = observaciones
        };

        _context.Viajes.Add(viaje);

        // Actualizar Vehiculo
        vehiculo.EnRuta = true;
        vehiculo.ID_Chofer_Asignado = choferId;

        await _context.SaveChangesAsync();
        return viaje;
    }

    public async Task<Viaje> FinalizarViajeAsync(int viajeId, string? observaciones, List<AjusteStockCierreDto>? ajustes = null)
    {
        var viaje = await _context.Viajes
            .Include(v => v.Vehiculo)
            .FirstOrDefaultAsync(v => v.ViajeId == viajeId);

        if (viaje == null) throw new KeyNotFoundException("Viaje no encontrado");
        if (viaje.Estado != EstadoViaje.EnCurso) throw new InvalidOperationException("El viaje no está en curso.");

        viaje.Estado = EstadoViaje.Finalizado;
        viaje.FechaRegreso = TimeHelper.Now;
        if (!string.IsNullOrEmpty(observaciones))
        {
            viaje.Observaciones += " | Final: " + observaciones;
        }

        // Process Adjustments (Stock Reconciliation)
        if (ajustes != null && ajustes.Any())
        {
            foreach (var ajuste in ajustes)
            {
                var diff = ajuste.CantidadReal - ajuste.CantidadTeorica;
                
                // Only process if there is a difference or if we want to enforce the Real quantity
                if (diff != 0)
                {
                    // Update StockVehiculo to match Real Quantity
                    var stock = await _context.StockVehiculos
                        .FirstOrDefaultAsync(s => s.VehiculoId == viaje.VehiculoId && s.ProductoId == ajuste.ProductoId);

                    if (stock != null)
                    {
                        stock.Cantidad = ajuste.CantidadReal;
                        stock.UltimaActualizacion = TimeHelper.Now;
                    }
                    else
                    {
                        // Create if not exists (unlikely if theoretical > 0, but possible if theoretical was 0 and found stock)
                        if (ajuste.CantidadReal > 0)
                        {
                            _context.StockVehiculos.Add(new StockVehiculo
                            {
                                VehiculoId = viaje.VehiculoId,
                                ProductoId = ajuste.ProductoId,
                                Cantidad = ajuste.CantidadReal,
                                UltimaActualizacion = TimeHelper.Now
                            });
                        }
                    }

                    // Register Movement (Merma or Ajuste)
                    // If diff < 0 (Real < Theoretical) => Missing => Merma
                    // If diff > 0 (Real > Theoretical) => Surplus => Ajuste (Entrada)
                    var tipo = diff < 0 ? TipoMovimientoStock.Merma : TipoMovimientoStock.AjusteInventario;
                    
                    var mov = new MovimientoStock
                    {
                        Fecha = TimeHelper.Now,
                        TipoMovimiento = tipo,
                        VehiculoId = viaje.VehiculoId,
                        ProductoId = ajuste.ProductoId,
                        Cantidad = diff, // Negative for Merma, Positive for Ajuste
                        UsuarioId = viaje.ChoferId,
                        Observaciones = $"Cierre Viaje #{viajeId}: {(diff < 0 ? "Faltante" : "Sobrante")} de {Math.Abs(diff)}"
                    };
                    _context.MovimientosStock.Add(mov);
                }
            }
        }

        // Liberar Vehiculo
        if (viaje.Vehiculo != null)
        {
            viaje.Vehiculo.EnRuta = false;
            viaje.Vehiculo.ID_Chofer_Asignado = null;
        }

        await _context.SaveChangesAsync();
        return viaje;
    }

    public async Task<Viaje?> ObtenerViajeActivoPorUsuarioAsync(int usuarioId)
    {
        var viaje = await _context.Viajes
            .Include(v => v.Vehiculo)
            .Include(v => v.Chofer)
            .Include(v => v.Acompanante)
            .FirstOrDefaultAsync(v => (v.ChoferId == usuarioId || v.AcompananteId == usuarioId) && v.Estado == EstadoViaje.EnCurso);

        // Self-healing: Si existe viaje activo pero el vehículo NO está en ruta (EnRuta == false),
        // es una inconsistencia. Cerramos el viaje automáticamente.
        if (viaje != null && viaje.Vehiculo != null && !viaje.Vehiculo.EnRuta)
        {
            viaje.Estado = EstadoViaje.Finalizado;
            viaje.FechaRegreso = TimeHelper.Now;
            viaje.Observaciones += " | Auto-Correction: Inconsistencia detectada (Vehículo no en ruta)";
            
            await _context.SaveChangesAsync();
            return null;
        }

        return viaje;
    }

    public async Task<Viaje?> ObtenerViajeActivoPorVehiculoAsync(int vehiculoId)
    {
        return await _context.Viajes
            .Include(v => v.Vehiculo)
            .FirstOrDefaultAsync(v => v.VehiculoId == vehiculoId && v.Estado == EstadoViaje.EnCurso);
    }

    public async Task<List<Viaje>> ObtenerViajesActivosAsync()
    {
        return await _context.Viajes
            .Include(v => v.Chofer)
            .Include(v => v.Vehiculo)
            .Where(v => v.Estado == EstadoViaje.EnCurso)
            .ToListAsync();
    }
}
