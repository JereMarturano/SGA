using Microsoft.EntityFrameworkCore;
using SGA.Data;
using SGA.Models;
using SGA.Models.Enums;

namespace SGA.Services;

public class PedidoService : IPedidoService
{
    private readonly AppDbContext _context;

    public PedidoService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Pedido>> GetPedidosPendientesAsync()
    {
        var pedidos = await _context.Pedidos
            .Include(p => p.Cliente)
            .Include(p => p.Detalles)
            .ThenInclude(d => d.Producto)
            .Include(p => p.Viaje)
            .Where(p => p.Estado == EstadoPedido.Pendiente || p.Estado == EstadoPedido.Asignado) 
            .OrderByDescending(p => p.FechaPedido)
            .ToListAsync();

        // Correct visual status for orders assigned to finished trips
        foreach (var p in pedidos)
        {
            if (p.Estado == EstadoPedido.Asignado && (p.Viaje == null || p.Viaje.Estado != EstadoViaje.EnCurso))
            {
                p.Estado = EstadoPedido.Pendiente;
                p.ViajeId = null;
                p.Viaje = null;
            }
        }

        return pedidos;
    }
    
    // Adjusted to get only truly 'Pending' (unassigned) if finding for assignment
    // But for the main list, we might want to see all.
    // Let's keep it broad and filter in Controller if needed.

    public async Task<List<Pedido>> GetPedidosPorViajeAsync(int viajeId)
    {
        return await _context.Pedidos
            .Include(p => p.Cliente)
            .Include(p => p.Detalles)
            .ThenInclude(d => d.Producto)
            .Where(p => p.ViajeId == viajeId)
            .ToListAsync();
    }

    public async Task<Pedido?> GetPedidoByIdAsync(int id)
    {
        return await _context.Pedidos
            .Include(p => p.Cliente)
            .Include(p => p.Detalles)
            .ThenInclude(d => d.Producto)
            .FirstOrDefaultAsync(p => p.PedidoId == id);
    }

    public async Task<Pedido> CrearPedidoAsync(Pedido pedido)
    {
        _context.Pedidos.Add(pedido);
        await _context.SaveChangesAsync();
        return pedido;
    }

    public async Task<Pedido> UpdatePedidoAsync(int id, Pedido pedido)
    {
        var existing = await _context.Pedidos.FindAsync(id);
        if (existing == null) throw new Exception("Pedido no encontrado");

        existing.FechaEntrega = pedido.FechaEntrega;
        existing.Observaciones = pedido.Observaciones;
        // Updating Items is complex, for now assume complete replacement or separate logic
        // But for simplicity in this MVP:
        
        // existing.Estado = pedido.Estado; // Status managed via actions
        
        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeletePedidoAsync(int id)
    {
        var pedido = await _context.Pedidos.FindAsync(id);
        if (pedido == null) return false;

        _context.Pedidos.Remove(pedido);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task AsignarPedidosAViajeAsync(int viajeId, List<int> pedidoIds)
    {
        var viaje = await _context.Viajes.FindAsync(viajeId);
        if (viaje == null) throw new Exception("Viaje no encontrado");

        var pedidos = await _context.Pedidos.Where(p => pedidoIds.Contains(p.PedidoId)).ToListAsync();
        
        foreach (var p in pedidos)
        {
            p.ViajeId = viajeId;
            p.Estado = EstadoPedido.Asignado;
        }

        await _context.SaveChangesAsync();
    }

    public async Task MarcarEntregadoAsync(int pedidoId)
    {
        var pedido = await _context.Pedidos.FindAsync(pedidoId);
        if (pedido == null) throw new Exception("Pedido no encontrado");

        pedido.Estado = EstadoPedido.Entregado;
        await _context.SaveChangesAsync();
    }
}
