using Microsoft.EntityFrameworkCore;
using SGA.Data;
using SGA.Models;

namespace SGA.Services;

public class ClienteService : IClienteService
{
    private readonly AppDbContext _context;

    public ClienteService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Cliente> CrearClienteAsync(Cliente cliente)
    {
        _context.Clientes.Add(cliente);
        await _context.SaveChangesAsync();
        return cliente;
    }

    public async Task<List<Cliente>> ObtenerTodosLosClientesAsync()
    {
        return await _context.Clientes.ToListAsync();
    }

    public async Task<Cliente?> ActualizarClienteAsync(int id, Cliente clienteActualizado)
    {
        var clienteExistente = await _context.Clientes.FindAsync(id);
        if (clienteExistente == null)
        {
            return null;
        }

        clienteExistente.NombreCompleto = clienteActualizado.NombreCompleto;
        clienteExistente.DNI = clienteActualizado.DNI;
        clienteExistente.Telefono = clienteActualizado.Telefono;
        clienteExistente.Email = clienteActualizado.Email;
        clienteExistente.Direccion = clienteActualizado.Direccion;
        clienteExistente.FechaCumpleanios = clienteActualizado.FechaCumpleanios;
        clienteExistente.RequiereFactura = clienteActualizado.RequiereFactura;
        clienteExistente.PrecioEspecial = clienteActualizado.PrecioEspecial;

        await _context.SaveChangesAsync();
        return clienteExistente;
    }
}
