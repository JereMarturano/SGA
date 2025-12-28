using SGA.Models;

namespace SGA.Services;

public interface IPedidoService
{
    Task<List<Pedido>> GetPedidosPendientesAsync();
    Task<List<Pedido>> GetPedidosPorViajeAsync(int viajeId);
    Task<Pedido> CrearPedidoAsync(Pedido pedido);
    Task<Pedido> UpdatePedidoAsync(int id, Pedido pedido);
    Task<bool> DeletePedidoAsync(int id);
    Task AsignarPedidosAViajeAsync(int viajeId, List<int> pedidoIds);
    Task<Pedido?> GetPedidoByIdAsync(int id);
    Task MarcarEntregadoAsync(int pedidoId);
}
