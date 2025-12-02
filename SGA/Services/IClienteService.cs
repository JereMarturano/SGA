using SGA.Models;

namespace SGA.Services;

public interface IClienteService
{
    Task<Cliente> CrearClienteAsync(Cliente cliente);
    Task<List<Cliente>> ObtenerTodosLosClientesAsync();
    Task<Cliente?> ObtenerClientePorIdAsync(int id);
    Task<Cliente?> ActualizarClienteAsync(int id, Cliente cliente);
    Task<bool> EliminarClienteAsync(int id);
}
