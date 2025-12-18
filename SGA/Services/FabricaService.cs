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
        if (produccion.CantidadKg <= 0) throw new ArgumentException("La cantidad total debe ser mayor a 0.");
        if (produccion.Ingredientes == null || !produccion.Ingredientes.Any()) throw new ArgumentException("Debe agregar al menos un ingrediente.");

        // Consume each ingredient from its Silo
        foreach (var ingrediente in produccion.Ingredientes)
        {
            if (ingrediente.CantidadKg <= 0) continue;
            await _siloService.RegistrarConsumoAsync(ingrediente.SiloId, ingrediente.CantidadKg);
        }

        // Add to Destination Silo (if producing feed into a silo)
        if (produccion.SiloDestinoId.HasValue)
        {
            await _siloService.RegistrarCargaAsync(produccion.SiloDestinoId.Value, produccion.CantidadKg, 0);
        }

        _context.Producciones.Add(produccion);
        await _context.SaveChangesAsync();
        return produccion;
    }

    public async Task<IEnumerable<Produccion>> GetHistorialProduccionAsync()
    {
        return await _context.Producciones
            .Include(p => p.Ingredientes)
                .ThenInclude(i => i.Silo)
            .Include(p => p.SiloDestino)
            .Include(p => p.Usuario)
            .OrderByDescending(p => p.Fecha)
            .ToListAsync();
    }
}
