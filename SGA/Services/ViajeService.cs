using Microsoft.EntityFrameworkCore;
using SGA.Data;
using SGA.Helpers;
using SGA.Models;
using SGA.Models.Enums;

namespace SGA.Services;

public class ViajeService : IViajeService
{
    private readonly AppDbContext _context;

    public ViajeService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Viaje> IniciarViajeAsync(int vehiculoId, int choferId, string? observaciones)
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
            .AnyAsync(v => v.ChoferId == choferId && v.Estado == EstadoViaje.EnCurso);
        if (existingTrip) throw new InvalidOperationException("El chofer ya tiene un viaje activo.");

        var viaje = new Viaje
        {
            VehiculoId = vehiculoId,
            ChoferId = choferId,
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

    public async Task<Viaje> FinalizarViajeAsync(int viajeId, string? observaciones)
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
        return await _context.Viajes
            .Include(v => v.Vehiculo)
            .FirstOrDefaultAsync(v => v.ChoferId == usuarioId && v.Estado == EstadoViaje.EnCurso);
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
