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
        // Validation: Check for duplicate DNI
        if (await _context.Clientes.AnyAsync(c => c.DNI == cliente.DNI))
        {
            throw new InvalidOperationException($"Ya existe un cliente con el DNI {cliente.DNI}.");
        }

        // Validation: Check for duplicate Email (if provided)
        if (!string.IsNullOrEmpty(cliente.Email) && await _context.Clientes.AnyAsync(c => c.Email == cliente.Email))
        {
            throw new InvalidOperationException($"Ya existe un cliente con el email {cliente.Email}.");
        }

        _context.Clientes.Add(cliente);
        await _context.SaveChangesAsync();
        return cliente;
    }

    public async Task<List<Cliente>> ObtenerTodosLosClientesAsync()
    {
        return await _context.Clientes.ToListAsync();
    }

    public async Task<Cliente?> ObtenerClientePorIdAsync(int id)
    {
        return await _context.Clientes.FindAsync(id);
    }

    public async Task<Cliente?> ActualizarClienteAsync(int id, Cliente clienteActualizado)
    {
        var clienteExistente = await _context.Clientes.FindAsync(id);
        if (clienteExistente == null)
        {
            return null;
        }

        // Validation: Check for duplicate DNI (excluding current client)
        if (await _context.Clientes.AnyAsync(c => c.DNI == clienteActualizado.DNI && c.ClienteId != id))
        {
            throw new InvalidOperationException($"Ya existe otro cliente con el DNI {clienteActualizado.DNI}.");
        }

        // Validation: Check for duplicate Email (excluding current client)
        if (!string.IsNullOrEmpty(clienteActualizado.Email) &&
            await _context.Clientes.AnyAsync(c => c.Email == clienteActualizado.Email && c.ClienteId != id))
        {
            throw new InvalidOperationException($"Ya existe otro cliente con el email {clienteActualizado.Email}.");
        }

        clienteExistente.NombreCompleto = clienteActualizado.NombreCompleto;
        clienteExistente.DNI = clienteActualizado.DNI;
        clienteExistente.Telefono = clienteActualizado.Telefono;
        clienteExistente.Email = clienteActualizado.Email;
        clienteExistente.Direccion = clienteActualizado.Direccion;
        clienteExistente.FechaCumpleanios = clienteActualizado.FechaCumpleanios;
        clienteExistente.RequiereFactura = clienteActualizado.RequiereFactura;
        clienteExistente.PrecioEspecial = clienteActualizado.PrecioEspecial;
        clienteExistente.Estado = clienteActualizado.Estado;
        clienteExistente.Deuda = clienteActualizado.Deuda;
        clienteExistente.VentasTotales = clienteActualizado.VentasTotales;
        clienteExistente.UltimaCompra = clienteActualizado.UltimaCompra;
        clienteExistente.MetodoPagoPreferido = clienteActualizado.MetodoPagoPreferido;

        await _context.SaveChangesAsync();
        return clienteExistente;
    }

    public async Task<bool> EliminarClienteAsync(int id)
    {
        var cliente = await _context.Clientes.FindAsync(id);
        if (cliente == null)
        {
            return false;
        }

        _context.Clientes.Remove(cliente);
        await _context.SaveChangesAsync();
        return true;
    }
}
