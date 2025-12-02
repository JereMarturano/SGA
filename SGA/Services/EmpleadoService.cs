using Microsoft.EntityFrameworkCore;
using SGA.Data;
using SGA.Models;

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

        return stats;
    }
}
