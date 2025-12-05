using SGA.Models;
using SGA.Models.DTOs;

namespace SGA.Services;

public interface IVehiculoService
{
    Task<IEnumerable<Vehiculo>> GetAllAsync();
    Task<Vehiculo?> GetByIdAsync(int id);
    Task<Vehiculo> CreateAsync(CreateVehiculoDto dto);
    Task<Vehiculo?> UpdateAsync(int id, UpdateVehiculoDto dto);
    Task<bool> DeleteAsync(int id);
    Task<IEnumerable<object>> GetStockEnCalleAsync();
}
