using SGA.Models;

namespace SGA.Services;

public interface ISiloService
{
    Task<IEnumerable<Silo>> GetAllAsync();
    Task<Silo?> GetByIdAsync(int id);
    Task<Silo> CreateAsync(Silo silo);
    Task<Silo> UpdateAsync(int id, Silo silo);
    Task DeleteAsync(int id);

    Task RegistrarCargaAsync(int siloId, decimal cantidadKg, decimal precioTotal);
    Task RegistrarConsumoAsync(int siloId, decimal cantidadKg);
}
