using Microsoft.EntityFrameworkCore;
using SGA.Data;
using SGA.Models;
using SGA.Models.DTOs;

namespace SGA.Services;

public class VehiculoService : IVehiculoService
{
    private readonly AppDbContext _context;

    public VehiculoService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Vehiculo>> GetAllAsync()
    {
        return await _context.Vehiculos
            .Include(v => v.ChoferAsignado)
            .ToListAsync();
    }

    public async Task<Vehiculo?> GetByIdAsync(int id)
    {
        return await _context.Vehiculos
            .Include(v => v.ChoferAsignado)
            .FirstOrDefaultAsync(v => v.VehiculoId == id);
    }

    public async Task<Vehiculo> CreateAsync(CreateVehiculoDto dto)
    {
        if (await _context.Vehiculos.AnyAsync(v => v.Patente == dto.Patente))
        {
            throw new InvalidOperationException($"Un vehículo con la patente {dto.Patente} ya existe.");
        }

        var vehiculo = new Vehiculo
        {
            Patente = dto.Patente,
            Marca = dto.Marca,
            Modelo = dto.Modelo,
            ConsumoPromedioLts100Km = dto.ConsumoPromedioLts100Km,
            CapacidadCarga = dto.CapacidadCarga,
            ID_Chofer_Asignado = dto.ID_Chofer_Asignado,
            Kilometraje = dto.Kilometraje,
            EnRuta = false, // Default
            Estado = dto.Estado,
            UltimoCambioAceite = dto.UltimoCambioAceite,
            TipoAceite = dto.TipoAceite,
            KilometrajeProximoCambioAceite = dto.KilometrajeProximoCambioAceite,
            EstadoCubiertas = dto.EstadoCubiertas,
            Notas = dto.Notas
        };

        _context.Vehiculos.Add(vehiculo);
        await _context.SaveChangesAsync();
        return vehiculo;
    }

    public async Task<Vehiculo?> UpdateAsync(int id, UpdateVehiculoDto dto)
    {
        var vehiculo = await _context.Vehiculos.FindAsync(id);
        if (vehiculo == null)
        {
            return null;
        }

        if (dto.Patente != vehiculo.Patente && await _context.Vehiculos.AnyAsync(v => v.Patente == dto.Patente))
        {
            throw new InvalidOperationException($"Un vehículo con la patente {dto.Patente} ya existe.");
        }



        vehiculo.Patente = dto.Patente;
        vehiculo.Marca = dto.Marca;
        vehiculo.Modelo = dto.Modelo;
        vehiculo.ConsumoPromedioLts100Km = dto.ConsumoPromedioLts100Km;
        vehiculo.CapacidadCarga = dto.CapacidadCarga;
        vehiculo.ID_Chofer_Asignado = dto.ID_Chofer_Asignado;
        vehiculo.Kilometraje = dto.Kilometraje;
        vehiculo.EnRuta = dto.EnRuta;
        vehiculo.Estado = dto.Estado;
        vehiculo.UltimoCambioAceite = dto.UltimoCambioAceite;
        vehiculo.TipoAceite = dto.TipoAceite;
        vehiculo.KilometrajeProximoCambioAceite = dto.KilometrajeProximoCambioAceite;
        vehiculo.EstadoCubiertas = dto.EstadoCubiertas;
        vehiculo.Notas = dto.Notas;

        await _context.SaveChangesAsync();
        return vehiculo;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var vehiculo = await _context.Vehiculos.FindAsync(id);
        if (vehiculo == null)
        {
            return false;
        }

        // Optional: Check business rules, e.g., if vehicle has stock or is en route
        if (vehiculo.EnRuta)
        {
            throw new InvalidOperationException("No se puede eliminar un vehículo que está en ruta.");
        }

        var hasStock = await _context.StockVehiculos.AnyAsync(s => s.VehiculoId == id && s.Cantidad > 0);
        if (hasStock)
        {
            throw new InvalidOperationException("No se puede eliminar un vehículo que tiene stock cargado.");
        }

        _context.Vehiculos.Remove(vehiculo);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<object>> GetStockEnCalleAsync()
    {
        var vehiculos = await _context.Vehiculos
            .Include(v => v.ChoferAsignado)
            .ToListAsync();

        var result = new List<object>();

        foreach (var v in vehiculos)
        {
            var stock = await _context.StockVehiculos
                .Where(s => s.VehiculoId == v.VehiculoId && s.Cantidad > 0)
                .Include(s => s.Producto)
                .Select(s => new
                {
                    Producto = s.Producto.Nombre,
                    Cantidad = s.Cantidad
                })
                .ToListAsync();

            result.Add(new
            {
                Id = v.VehiculoId,
                Vehiculo = $"{v.Marca} {v.Modelo} ({v.Patente})",
                Chofer = v.ChoferAsignado?.Nombre ?? "Sin Asignar",
                EnRuta = v.EnRuta,
                Stock = stock
            });
        }

        return result;
    }
}
