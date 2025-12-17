using Microsoft.EntityFrameworkCore;
using SGA.Data;
using SGA.Models;
using SGA.Models.Enums; // If needed

namespace SGA.Services;

public class GalponService : IGalponService
{
    private readonly AppDbContext _context;

    public GalponService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Galpon>> GetAllAsync()
    {
        return await _context.Galpones.ToListAsync();
    }

    public async Task<Galpon?> GetByIdAsync(int id)
    {
        return await _context.Galpones.FindAsync(id);
    }

    public async Task<Galpon> CreateAsync(Galpon galpon)
    {
        _context.Galpones.Add(galpon);
        await _context.SaveChangesAsync();
        return galpon;
    }

    public async Task<Galpon> UpdateAsync(int id, Galpon galpon)
    {
        var existing = await _context.Galpones.FindAsync(id);
        if (existing == null) throw new KeyNotFoundException("Galpon not found");

        existing.Nombre = galpon.Nombre;
        existing.Tipo = galpon.Tipo;
        existing.FechaBajaEstimada = galpon.FechaBajaEstimada;
        existing.Estado = galpon.Estado;
        // CantidadAves usually updated via Events, but explicit update allowed for Admin corrections
        existing.CantidadAves = galpon.CantidadAves; 
        existing.PrecioCompraAve = galpon.PrecioCompraAve;

        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task DeleteAsync(int id)
    {
        var galpon = await _context.Galpones.FindAsync(id);
        if (galpon != null)
        {
            _context.Galpones.Remove(galpon);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> RegistrarEventoAsync(EventoGalpon evento)
    {
        var galpon = await _context.Galpones.FindAsync(evento.GalponId);
        if (galpon == null) return false;

        _context.EventosGalpon.Add(evento);

        // Update logic based on event type
        if (evento.TipoEvento == "Muerte" || evento.TipoEvento == "Egreso" || evento.TipoEvento == "Venta")
        {
            galpon.CantidadAves -= evento.Cantidad;
        }
        else if (evento.TipoEvento == "Ingreso")
        {
            galpon.CantidadAves += evento.Cantidad;
        }

        if (galpon.CantidadAves < 0) galpon.CantidadAves = 0;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task RecalcularStockAsync(int galponId)
    {
        // Optional: Reconstruct from history if needed
        var events = await _context.EventosGalpon.Where(e => e.GalponId == galponId).ToListAsync();
        // Assume initial stock is 0 or needs a "Base" event? 
        // For now, relies on running total.
    }
}
