using Microsoft.EntityFrameworkCore;
using SGA.Data;
using SGA.Models.DTOs;

namespace SGA.Services;

public class ReporteService : IReporteService
{
    private readonly AppDbContext _context;

    public ReporteService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ReporteFinancieroDTO> GenerarReporteFinancieroAsync(DateTime fechaInicio, DateTime fechaFin, int? vehiculoId = null)
    {
        // Asegurar rango de fechas correcto (inclusive el último día hasta el último tick)
        var inicio = fechaInicio.Date;
        var fin = fechaFin.Date.AddDays(1).AddTicks(-1);

        // 1. Consultar Ventas
        var queryVentas = _context.Ventas
            .Include(v => v.Detalles)
            .ThenInclude(d => d.Producto)
            .Where(v => v.Fecha >= inicio && v.Fecha <= fin);

        if (vehiculoId.HasValue)
        {
            queryVentas = queryVentas.Where(v => v.VehiculoId == vehiculoId.Value);
        }

        var ventas = await queryVentas.ToListAsync();

        // 2. Consultar Gastos
        var queryGastos = _context.GastosVehiculos
            .Where(g => g.Fecha >= inicio && g.Fecha <= fin);

        if (vehiculoId.HasValue)
        {
            queryGastos = queryGastos.Where(g => g.VehiculoId == vehiculoId.Value);
        }

        var gastos = await queryGastos.ToListAsync();

        // 3. Procesar Datos
        var reporte = new ReporteFinancieroDTO
        {
            FechaInicio = inicio,
            FechaFin = fin,
            TotalVentas = ventas.Sum(v => v.Total),
            TotalGastos = gastos.Sum(g => g.Monto),
            CantidadVentas = ventas.Count
        };

        // Cálculos derivados
        reporte.GananciaNeta = reporte.TotalVentas - reporte.TotalGastos;
        reporte.MargenGananciaPorcentaje = reporte.TotalVentas > 0 
            ? (reporte.GananciaNeta / reporte.TotalVentas) * 100 
            : 0;
        
        reporte.TicketPromedio = reporte.CantidadVentas > 0 
            ? reporte.TotalVentas / reporte.CantidadVentas 
            : 0;

        // 4. Agrupaciones

        // Por Método de Pago
        reporte.VentasPorMetodoPago = ventas
            .GroupBy(v => v.MetodoPago)
            .Select(g => new VentaPorMetodoPagoDTO
            {
                MetodoPago = g.Key,
                Total = g.Sum(v => v.Total),
                CantidadTransacciones = g.Count()
            })
            .ToList();

        // Por Producto (requiere aplanar detalles)
        var detallesPlanos = ventas.SelectMany(v => v.Detalles);
        reporte.VentasPorProducto = detallesPlanos
            .GroupBy(d => d.ProductoId)
            .Select(g => new VentaPorProductoDTO
            {
                ProductoId = g.Key,
                NombreProducto = g.First().Producto?.Nombre ?? "Desconocido",
                CantidadVendida = g.Sum(d => d.Cantidad),
                TotalGenerado = g.Sum(d => d.Subtotal)
            })
            .OrderByDescending(x => x.TotalGenerado)
            .ToList();

        // Por Tipo de Gasto
        reporte.GastosPorTipo = gastos
            .GroupBy(g => g.Tipo)
            .Select(g => new GastoPorTipoDTO
            {
                TipoGasto = g.Key,
                Total = g.Sum(x => x.Monto),
                CantidadRegistros = g.Count()
            })
            .OrderByDescending(x => x.Total)
            .ToList();

        return reporte;
    }
}
