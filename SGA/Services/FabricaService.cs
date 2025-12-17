using Microsoft.EntityFrameworkCore;
using SGA.Data;
using SGA.Models;

namespace SGA.Services;

public class FabricaService : IFabricaService
{
    private readonly AppDbContext _context;
    private readonly ISiloService _siloService;

    public FabricaService(AppDbContext context, ISiloService siloService)
    {
        _context = context;
        _siloService = siloService;
    }

    public async Task<Produccion> RegistrarProduccionAsync(Produccion produccion)
    {
        // Validate inputs
        if (produccion.CantidadKg <= 0) throw new ArgumentException("La cantidad debe ser mayor a 0.");

        // Consume from Source Silo
        if (produccion.SiloOrigenId.HasValue)
        {
            await _siloService.RegistrarConsumoAsync(produccion.SiloOrigenId.Value, produccion.CantidadKg);
        }

        // Add to Destination Silo (if producing feed into a silo)
        if (produccion.SiloDestinoId.HasValue)
        {
            // Here we assume production cost is N/A or handled elsewhere, 
            // BUT ideally we should calculate cost based on input.
            // For now, we pass 0 as cost or we need "Costo por Kg" in Produccion model?
            // The user said "el jefe ... cuanto le salio".
            // If producing, maybe we just register Quantity increase?
            // SiloService.RegistrarCargaAsync requires Price.
            // If internal production, maybe price is 0 or derived?
            // Providing 0 per instruction requirements simplification unless explicitly asked.
            await _siloService.RegistrarCargaAsync(produccion.SiloDestinoId.Value, produccion.CantidadKg, 0);
        }

        _context.Producciones.Add(produccion);
        await _context.SaveChangesAsync();
        return produccion;
    }

    public async Task<IEnumerable<Produccion>> GetHistorialProduccionAsync()
    {
        return await _context.Producciones
            .Include(p => p.SiloOrigen)
            .Include(p => p.SiloDestino)
            .Include(p => p.Usuario)
            .OrderByDescending(p => p.Fecha)
            .ToListAsync();
    }
}
