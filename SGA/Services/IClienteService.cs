using SGA.Models;
using SGA.Models.DTOs;
using SGA.Models.Enums;

namespace SGA.Services;

public interface IClienteService
{
    Task<Cliente> CrearClienteAsync(Cliente cliente);
    Task<List<Cliente>> ObtenerTodosLosClientesAsync();
    Task<Cliente?> ObtenerClientePorIdAsync(int id);
    Task<Cliente?> ActualizarClienteAsync(int id, Cliente cliente);
    Task<bool> EliminarClienteAsync(int id);
    Task<Pago> RegistrarPagoAsync(int clienteId, decimal monto, MetodoPago metodo, string? observacion);
    Task<Cliente?> AjustarDeudaAsync(int clienteId, decimal monto, bool esAumento, string motivo);
    Task<List<HistorialPagoDTO>> ObtenerHistorialPagosAsync(int clienteId);
}
