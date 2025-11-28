using Microsoft.EntityFrameworkCore;
using SGA.Data;
using SGA.Models;

namespace SGA.Services;

public class GastoVehiculoService : IGastoVehiculoService
{
    private readonly AppDbContext _context;

    public GastoVehiculoService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<GastoVehiculo> RegistrarGastoAsync(GastoVehiculo gasto)
    {
        _context.GastosVehiculos.Add(gasto);
        await _context.SaveChangesAsync();
        return gasto;
    }

    public async Task<List<GastoVehiculo>> ObtenerGastosPorVehiculoAsync(int vehiculoId, DateTime? desde = null, DateTime? hasta = null)
    {
        var query = _context.GastosVehiculos
            .Include(g => g.Vehiculo)
            .Include(g => g.Usuario) // Incluir información del usuario si es necesario
            .Where(g => g.VehiculoId == vehiculoId);

        if (desde.HasValue)
        {
            query = query.Where(g => g.Fecha >= desde.Value);
        }

        if (hasta.HasValue)
        {
            query = query.Where(g => g.Fecha <= hasta.Value);
        }

        return await query.OrderByDescending(g => g.Fecha).ToListAsync();
    }

    public async Task<GastoVehiculo?> ObtenerGastoPorIdAsync(int id)
    {
        return await _context.GastosVehiculos
            .Include(g => g.Vehiculo)
            .FirstOrDefaultAsync(g => g.GastoId == id);
    }

    public async Task<GastoVehiculo?> ActualizarGastoAsync(int id, GastoVehiculo gastoActualizado)
    {
        var gastoExistente = await _context.GastosVehiculos.FindAsync(id);
        if (gastoExistente == null)
        {
            return null;
        }

        gastoExistente.Fecha = gastoActualizado.Fecha;
        gastoExistente.Monto = gastoActualizado.Monto;
        gastoExistente.Tipo = gastoActualizado.Tipo;
        gastoExistente.Descripcion = gastoActualizado.Descripcion;
        gastoExistente.Kilometraje = gastoActualizado.Kilometraje;
        gastoExistente.LitrosCombustible = gastoActualizado.LitrosCombustible;
        gastoExistente.UsuarioId = gastoActualizado.UsuarioId;
        // No permitimos cambiar el VehiculoId normalmente, pero se podría agregar si fuera necesario.

        await _context.SaveChangesAsync();
        return gastoExistente;
    }

    public async Task<bool> EliminarGastoAsync(int id)
    {
        var gasto = await _context.GastosVehiculos.FindAsync(id);
        if (gasto == null)
        {
            return false;
        }

        _context.GastosVehiculos.Remove(gasto);
        await _context.SaveChangesAsync();
        return true;
    }
}
