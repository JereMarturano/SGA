using SGA.Models;

namespace SGA.Services;

public interface IGalponService
{
    Task<IEnumerable<Galpon>> GetAllAsync();
    Task<Galpon?> GetByIdAsync(int id);
    Task<Galpon> CreateAsync(Galpon galpon);
    Task<Galpon> UpdateAsync(int id, Galpon galpon); // General update
    Task DeleteAsync(int id);
    
    // Domain specific
    Task<bool> RegistrarEventoAsync(EventoGalpon evento);
    Task RecalcularStockAsync(int galponId);
}
