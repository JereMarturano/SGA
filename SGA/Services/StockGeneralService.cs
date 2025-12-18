using Microsoft.EntityFrameworkCore;
using SGA.Data;
using SGA.Models;
using SGA.Models.Enums;

namespace SGA.Services;

public class StockGeneralService : IStockGeneralService
{
    private readonly AppDbContext _context;

    public StockGeneralService(AppDbContext context)
    {
        _context = context;
    }

    // Ubicaciones
    public async Task<IEnumerable<Ubicacion>> GetUbicacionesAsync()
    {
        return await _context.Ubicaciones.ToListAsync();
    }

    public async Task EnsureLocationsExistAsync()
    {
        var locations = new List<string> { "Galpon 1", "Galpon 2", "Galpon 3", "Galpon 4", "Deposito", "Taller", "Habitacion Pollitos" };
        foreach (var name in locations)
        {
            if (!await _context.Ubicaciones.AnyAsync(u => u.Nombre == name))
            {
                var type = name.Contains("Galpon") || name.Contains("Pollitos") ? "Produccion" :
                           name.Contains("Deposito") ? "Almacenamiento" : "Mantenimiento";
                _context.Ubicaciones.Add(new Ubicacion { Nombre = name, Tipo = type });
            }
        }

        // Ensure silos exist
        if (!await _context.Silos.AnyAsync())
        {
            _context.Silos.AddRange(
                new Silo { Nombre = "Silo 1", CapacidadKg = 10000 },
                new Silo { Nombre = "Silo 2", CapacidadKg = 10000 }
            );
        }

        await _context.SaveChangesAsync();
    }

    // Lotes & Mortality
    public async Task<LoteAve?> GetActiveLoteAsync(int ubicacionId)
    {
        return await _context.LotesAves
            .Where(l => l.UbicacionId == ubicacionId && l.Activo)
            .OrderByDescending(l => l.FechaAlta)
            .FirstOrDefaultAsync();
    }

    public async Task<IEnumerable<LoteAve>> GetLoteHistoryAsync(int ubicacionId)
    {
         return await _context.LotesAves
            .Where(l => l.UbicacionId == ubicacionId)
            .OrderByDescending(l => l.FechaAlta)
            .ToListAsync();
    }

    public async Task<LoteAve> CreateLoteAsync(LoteAve lote)
    {
        // Deactivate previous active batch in this location if any
        var currentActive = await GetActiveLoteAsync(lote.UbicacionId);
        if (currentActive != null)
        {
            currentActive.Activo = false;
            currentActive.FechaBaja = DateTime.Now;
        }

        lote.Activo = true;
        lote.CantidadActual = lote.CantidadInicial;
        lote.FechaAlta = DateTime.Now; // Or user provided

        _context.LotesAves.Add(lote);
        await _context.SaveChangesAsync();
        return lote;
    }

    public async Task<LoteAve> UpdateLoteAsync(LoteAve lote)
    {
        _context.Entry(lote).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return lote;
    }

    public async Task<EventoMortalidad> RegisterMortalidadAsync(EventoMortalidad evento, int usuarioId)
    {
        var lote = await _context.LotesAves.FindAsync(evento.LoteId);
        if (lote == null) throw new KeyNotFoundException("Lote not found");
        if (!lote.Activo) throw new InvalidOperationException("Cannot register mortality on an inactive batch");

        if (lote.CantidadActual < evento.Cantidad)
            throw new InvalidOperationException("Mortality count exceeds current quantity");

        lote.CantidadActual -= evento.Cantidad;
        evento.UsuarioId = usuarioId;

        _context.EventosMortalidad.Add(evento);
        await _context.SaveChangesAsync();
        return evento;
    }

    // Inventory
    public async Task<IEnumerable<ItemInventario>> GetItemsByUbicacionAsync(int ubicacionId)
    {
        return await _context.ItemsInventario
            .Where(i => i.UbicacionId == ubicacionId)
            .ToListAsync();
    }

    public async Task<ItemInventario> GetItemByIdAsync(int id)
    {
        var item = await _context.ItemsInventario.FindAsync(id);
        if (item == null) throw new KeyNotFoundException("Item not found");
        return item;
    }

    public async Task<ItemInventario> CreateOrUpdateItemAsync(ItemInventario item)
    {
        if (item.Id == 0)
        {
            _context.ItemsInventario.Add(item);
        }
        else
        {
            _context.Entry(item).State = EntityState.Modified;
        }
        await _context.SaveChangesAsync();
        return item;
    }

    public async Task<bool> DeleteItemAsync(int id)
    {
        var item = await _context.ItemsInventario.FindAsync(id);
        if (item == null) return false;
        _context.ItemsInventario.Remove(item);
        await _context.SaveChangesAsync();
        return true;
    }

    // Silos
    public async Task<IEnumerable<Silo>> GetSilosAsync()
    {
        return await _context.Silos.ToListAsync();
    }

    public async Task<Silo> GetSiloByIdAsync(int id)
    {
         var silo = await _context.Silos.FindAsync(id);
         if (silo == null) throw new KeyNotFoundException("Silo not found");
         return silo;
    }

    public async Task<IEnumerable<ContenidoSilo>> GetSiloContentsAsync(int siloId)
    {
        return await _context.ContenidosSilos
            .Where(c => c.SiloId == siloId)
            .ToListAsync();
    }

    public async Task<ContenidoSilo> UpdateSiloContentAsync(ContenidoSilo contenido)
    {
        contenido.UltimaActualizacion = DateTime.Now;
        if (contenido.Id == 0)
        {
            _context.ContenidosSilos.Add(contenido);
        }
        else
        {
            _context.Entry(contenido).State = EntityState.Modified;
        }
        await _context.SaveChangesAsync();
        return contenido;
    }
}
