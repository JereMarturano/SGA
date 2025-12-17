using SGA.Models;

namespace SGA.Services;

public interface IStockGeneralService
{
    // Ubicaciones
    Task<IEnumerable<Ubicacion>> GetUbicacionesAsync();

    // Lotes & Mortality (Galpones/Pollitos)
    Task<LoteAve?> GetActiveLoteAsync(int ubicacionId);
    Task<IEnumerable<LoteAve>> GetLoteHistoryAsync(int ubicacionId);
    Task<LoteAve> CreateLoteAsync(LoteAve lote);
    Task<LoteAve> UpdateLoteAsync(LoteAve lote);
    Task<EventoMortalidad> RegisterMortalidadAsync(EventoMortalidad evento, int usuarioId);

    // Inventory (Deposito/Taller)
    Task<IEnumerable<ItemInventario>> GetItemsByUbicacionAsync(int ubicacionId);
    Task<ItemInventario> GetItemByIdAsync(int id);
    Task<ItemInventario> CreateOrUpdateItemAsync(ItemInventario item);
    Task<bool> DeleteItemAsync(int id);

    // Silos
    Task<IEnumerable<Silo>> GetSilosAsync();
    Task<Silo> GetSiloByIdAsync(int id);
    Task<IEnumerable<ContenidoSilo>> GetSiloContentsAsync(int siloId);
    Task<ContenidoSilo> UpdateSiloContentAsync(ContenidoSilo contenido);

    // Seeding/Initialization
    Task EnsureLocationsExistAsync();
}
