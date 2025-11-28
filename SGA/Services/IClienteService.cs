using SGA.Models;

namespace SGA.Services;

public interface IClienteService
{
    Task<Cliente> CrearClienteAsync(Cliente cliente);
    Task<List<Cliente>> ObtenerTodosLosClientesAsync();
    Task<Cliente?> ActualizarClienteAsync(int id, Cliente cliente);
}
