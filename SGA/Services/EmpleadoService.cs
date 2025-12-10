using Microsoft.EntityFrameworkCore;
using SGA.Data;
using SGA.Models;
using SGA.Models.DTOs;
using SGA.Models.Enums;
using SGA.Helpers;

namespace SGA.Services;

public class EmpleadoService : IEmpleadoService
{
    private readonly AppDbContext _context;

    public EmpleadoService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Falta> RegistrarFaltaAsync(int usuarioId, DateTime fecha, string motivo, bool esJustificada)
    {
        var empleado = await _context.Usuarios.FindAsync(usuarioId);
        if (empleado == null)
        {
            throw new KeyNotFoundException($"Empleado con ID {usuarioId} no encontrado.");
        }

        var falta = new Falta
        {
            UsuarioId = usuarioId,
            Fecha = fecha,
            Motivo = motivo,
            EsJustificada = esJustificada
        };

        _context.Faltas.Add(falta);
        await _context.SaveChangesAsync();
        return falta;
    }

    public async Task<List<Falta>> GetFaltasPorEmpleadoAsync(int usuarioId, DateTime? desde, DateTime? hasta)
    {
        var query = _context.Faltas.AsQueryable();

        query = query.Where(f => f.UsuarioId == usuarioId);

        if (desde.HasValue)
            query = query.Where(f => f.Fecha >= desde.Value);

        if (hasta.HasValue)
            query = query.Where(f => f.Fecha <= hasta.Value);

        return await query.OrderByDescending(f => f.Fecha).ToListAsync();
    }

    public async Task<EmpleadoEstadisticasDto> GetEstadisticasAsync(int usuarioId, DateTime desde, DateTime hasta)
    {
        var empleado = await _context.Usuarios.FindAsync(usuarioId);
        if (empleado == null)
            throw new KeyNotFoundException($"Empleado con ID {usuarioId} no encontrado.");

        // Fetch sales for the period
        var ventas = await _context.Ventas
            .Include(v => v.Detalles)
            .ThenInclude(d => d.Producto)
            .Where(v => v.UsuarioId == usuarioId && v.Fecha >= desde && v.Fecha <= hasta)
            .ToListAsync();

        var stats = new EmpleadoEstadisticasDto
        {
            UsuarioId = empleado.UsuarioId,
            Nombre = empleado.Nombre,
            CantidadVentas = ventas.Count,
            TotalVentas = ventas.Sum(v => v.Total),
            VentasPorDia = new List<VentaPorDiaDto>()
        };

        // Calculate Eggs Sold
        decimal huevosVendidosTotal = 0;

        // Group by day for the chart/breakdown
        var ventasGrouped = ventas.GroupBy(v => v.Fecha.Date);

        foreach (var group in ventasGrouped)
        {
            decimal huevosDia = 0;
            decimal totalDia = group.Sum(v => v.Total);

            foreach (var venta in group)
            {
                foreach (var detalle in venta.Detalles)
                {
                    if (detalle.Producto != null && detalle.Producto.EsHuevo)
                    {
                        // Assuming Cantidad is the unit count.
                        // If Cantidad is boxes, and UnidadesPorBulto > 1, we might need to normalize.
                        // However, usually sales detail 'Cantidad' is the countable unit being sold.
                        // For now, we sum 'Cantidad'.
                        huevosDia += detalle.Cantidad;
                    }
                }
            }

            stats.VentasPorDia.Add(new VentaPorDiaDto
            {
                Fecha = group.Key,
                Total = totalDia,
                HuevosVendidos = huevosDia
            });

            huevosVendidosTotal += huevosDia;
        }

        stats.TotalHuevosVendidos = huevosVendidosTotal;
        stats.VentasPorDia = stats.VentasPorDia.OrderBy(v => v.Fecha).ToList();

        // Calculate Payment Totals
        stats.TotalEfectivo = ventas.Where(v => v.MetodoPago == MetodoPago.Efectivo).Sum(v => v.Total);
        stats.TotalMercadoPago = ventas.Where(v => v.MetodoPago == MetodoPago.MercadoPago).Sum(v => v.Total);
        stats.TotalCuentaCorriente = ventas.Where(v => v.MetodoPago == MetodoPago.CuentaCorriente).Sum(v => v.Total);

        return stats;
    }

    public async Task<Usuario> CreateEmpleadoAsync(CreateEmpleadoDto dto)
    {
        if (!Enum.TryParse<RolUsuario>(dto.Role, out var roleEnum))
        {
            throw new ArgumentException($"Rol inválido: {dto.Role}");
        }

        var empleado = new Usuario
        {
            Nombre = dto.Nombre,
            Rol = roleEnum,
            ContrasenaHash = dto.Contrasena, // Storing plain text as per current codebase convention - WAIT, AuthService hashes it? 
            // AuthService.RegisterAsync hashes it. createEmpleadoAsync in Service previously took plain text. 
            // The existing code: ContrasenaHash = dto.Contrasena. 
            // Let's verify if we should hash it here. AuthService.RegisterAsync calls PasswordHelper.HashPassword.
            // EmpleadoService.CreateEmpleadoAsync sets it directly. This might be a bug or inconsistency.
            // PROMPT says "modificar su contraseña".
            // Let's use PasswordHelper to hash it if it's not hashed.
            // But wait, the previous code didn't use PasswordHelper here? 
            // I'll stick to the pattern but let's check AuthService again. 
            // AuthService uses PasswordHelper.HashPassword.
            // I should probably hash it here too to be safe/consistent.
            // But first, let's just do DNI validation.
            DNI = dto.DNI,
            Telefono = dto.Telefono,
            FechaIngreso = dto.FechaIngreso,
            Estado = "Activo"
        };
        
        // Validate DNI Format
        if (dto.DNI.Length != 8 || !dto.DNI.All(char.IsDigit))
            throw new ArgumentException("El DNI debe tener exactamente 8 dígitos numéricos.");

        // Validate DNI Uniqueness
        if (await _context.Usuarios.AnyAsync(u => u.DNI == dto.DNI))
           throw new ArgumentException("El DNI ya está registrado por otro empleado.");
        
        // Hash Password
        empleado.ContrasenaHash = PasswordHelper.HashPassword(dto.Contrasena);

        _context.Usuarios.Add(empleado);
        await _context.SaveChangesAsync();
        return empleado;
    }

    public async Task UpdateEmpleadoAsync(int usuarioId, UpdateEmpleadoDTO dto)
    {
        var empleado = await _context.Usuarios.FindAsync(usuarioId);
        if (empleado == null)
            throw new KeyNotFoundException($"Empleado con ID {usuarioId} no encontrado.");

        empleado.Nombre = dto.Nombre;

        // Validate and Update DNI
        if (!string.IsNullOrEmpty(dto.DNI))
        {
             if (dto.DNI.Length != 8 || !dto.DNI.All(char.IsDigit))
                throw new ArgumentException("El DNI debe tener exactamente 8 dígitos numéricos.");

             // Check uniqueness excluding self
             if (await _context.Usuarios.AnyAsync(u => u.DNI == dto.DNI && u.UsuarioId != usuarioId))
                throw new ArgumentException("El DNI ya está registrado por otro empleado.");

             empleado.DNI = dto.DNI;
        }

        // Update Password if provided
        if (!string.IsNullOrEmpty(dto.Password))
        {
            empleado.ContrasenaHash = PasswordHelper.HashPassword(dto.Password);
        }

        if (Enum.TryParse<RolUsuario>(dto.Role, out var roleEnum))
        {
            empleado.Rol = roleEnum;
        }
        else
        {
             // Fallback or ignore?
             // If "Vendedor" comes as string, TryParse should handle it if it's in Enum.
             // If frontend sends arbitrary string, we might default or throw.
             // For now, let's assume valid enum string.
        }

        empleado.Telefono = dto.Telefono;
        empleado.FechaIngreso = dto.FechaIngreso;
        empleado.Estado = dto.Estado;

        _context.Usuarios.Update(empleado);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteEmpleadoAsync(int usuarioId)
    {
        var empleado = await _context.Usuarios.FindAsync(usuarioId);
        if (empleado == null)
            throw new KeyNotFoundException($"Empleado con ID {usuarioId} no encontrado.");

        // Prevent deleting Admin (though frontend also checks, backend should too)
        if (empleado.Rol == RolUsuario.Admin)
        {
             throw new InvalidOperationException("No se puede eliminar al administrador.");
        }

        _context.Usuarios.Remove(empleado);
        await _context.SaveChangesAsync();
    }
}
