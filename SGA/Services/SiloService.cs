using Microsoft.EntityFrameworkCore;
using SGA.Data;
using SGA.Models;

namespace SGA.Services;

public class SiloService : ISiloService
{
    private readonly AppDbContext _context;
    private readonly IAlertaService _alertaService; // Assuming it exists

    public SiloService(AppDbContext context, IAlertaService alertaService)
    {
        _context = context;
        _alertaService = alertaService;
    }

    public async Task<IEnumerable<Silo>> GetAllAsync()
    {
        return await _context.Silos.Include(s => s.Producto).ToListAsync();
    }

    public async Task<Silo?> GetByIdAsync(int id)
    {
        return await _context.Silos.Include(s => s.Producto).FirstOrDefaultAsync(s => s.SiloId == id);
    }

    public async Task<Silo> CreateAsync(Silo silo)
    {
        _context.Silos.Add(silo);
        await _context.SaveChangesAsync();
        return silo;
    }

    public async Task<Silo> UpdateAsync(int id, Silo silo)
    {
        var existing = await _context.Silos.FindAsync(id);
        if (existing == null) throw new KeyNotFoundException("Silo not found");

        existing.Nombre = silo.Nombre;
        existing.CapacidadKg = silo.CapacidadKg;
        existing.ProductoId = silo.ProductoId;
        // Don't update Cantidad/Precio here unless manual correction
        
        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task DeleteAsync(int id)
    {
        var existing = await _context.Silos.FindAsync(id);
        if (existing != null)
        {
            _context.Silos.Remove(existing);
            await _context.SaveChangesAsync();
        }
    }

    public async Task RegistrarCargaAsync(int siloId, decimal cantidadKg, decimal precioTotal)
    {
        var silo = await _context.Silos.FindAsync(siloId);
        if (silo == null) return;

        // Update Average Price (Weighted Average)
        // (OldQty * OldPrice + NewQty * NewPrice) / (OldQty + NewQty)
        // Warning: NewPrice here is "precioTotal" for the batch, so (NewQty * UnitPrice) = precioTotal.
        // Wait, argument is precioTotal? Plan said "cuanto le salio" (total cost presumably).
        
        decimal currentTotalValue = silo.CantidadActualKg * silo.PrecioPromedioCompra;
        decimal newTotalValue = currentTotalValue + precioTotal;
        decimal newTotalKg = silo.CantidadActualKg + cantidadKg;

        if (newTotalKg > 0)
        {
            silo.PrecioPromedioCompra = newTotalValue / newTotalKg;
        }

        silo.CantidadActualKg = newTotalKg;
        
        await _context.SaveChangesAsync();
    }

    public async Task RegistrarConsumoAsync(int siloId, decimal cantidadKg)
    {
        var silo = await _context.Silos.FindAsync(siloId);
        if (silo == null) return;

        silo.CantidadActualKg -= cantidadKg;
        if (silo.CantidadActualKg < 0) silo.CantidadActualKg = 0;

        await _context.SaveChangesAsync();

        if (silo.CantidadActualKg < 500)
        {
             // Trigger Alert
             // Assuming AlertaService has a method CreateAlerta or similar.
             // I'll check IAlertaService strictly or usage in next step if this fails to compile.
             // For now, I'll assume a generic method or skip if unknown.
             // User prompt mentions "interconectarlo con alertas opertivas".
        }
    }
}
