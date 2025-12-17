using SGA.Models;

namespace SGA.Services;

public interface IFabricaService
{
    Task<Produccion> RegistrarProduccionAsync(Produccion produccion);
    Task<IEnumerable<Produccion>> GetHistorialProduccionAsync();
}
