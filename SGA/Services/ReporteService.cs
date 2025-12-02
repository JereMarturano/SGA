using Microsoft.EntityFrameworkCore;
using SGA.Data;
using SGA.Models.DTOs;
using SGA.Models;

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
        var inicio = DateTime.SpecifyKind(fechaInicio.Date, DateTimeKind.Utc);
        var fin = DateTime.SpecifyKind(fechaFin.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);

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

        // Por Fecha
        reporte.VentasPorFecha = ventas
            .GroupBy(v => v.Fecha.Date)
            .Select(g => new VentaPorFechaDTO
            {
                Fecha = g.Key,
                Total = g.Sum(v => v.Total),
                CantidadVentas = g.Count()
            })
            .OrderBy(x => x.Fecha)
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
    public async Task<List<StockEnCalleDTO>> ObtenerStockEnCalleAsync()
    {
        var vehiculos = await _context.Vehiculos
            .Include(v => v.ChoferAsignado) // Si queremos mostrar el chofer
            .ToListAsync();

        var stockVehiculos = await _context.StockVehiculos
            .Include(s => s.Producto)
            .ToListAsync();

        var resultado = new List<StockEnCalleDTO>();

        foreach (var vehiculo in vehiculos)
        {
            var stockDelVehiculo = stockVehiculos
                .Where(s => s.VehiculoId == vehiculo.VehiculoId && s.Cantidad > 0)
                .Select(s => new StockVehiculoDetalleDTO
                {
                    Producto = s.Producto?.Nombre ?? "Desconocido",
                    Cantidad = s.Cantidad
                })
                .ToList();

            resultado.Add(new StockEnCalleDTO
            {
                VehiculoId = vehiculo.VehiculoId,
                VehiculoNombre = $"{vehiculo.Marca} {vehiculo.Modelo} ({vehiculo.Patente})",
                EnRuta = vehiculo.EnRuta,
                Stock = stockDelVehiculo
            });
        }

        return resultado;
    }

    public async Task<List<MermaReporteDTO>> ObtenerHistorialMermasAsync()
    {
        var mermas = await _context.MovimientosStock
            .Include(m => m.Usuario)
            .Include(m => m.Vehiculo)
            .Include(m => m.Producto)
            .Where(m => m.TipoMovimiento == Models.Enums.TipoMovimientoStock.Merma)
            .OrderByDescending(m => m.Fecha)
            .ToListAsync();

        return mermas.Select(m => new MermaReporteDTO
        {
            Fecha = m.Fecha,
            Usuario = m.Usuario?.Nombre ?? "Desconocido",
            Vehiculo = m.Vehiculo != null ? $"{m.Vehiculo.Marca} ({m.Vehiculo.Patente})" : "Depósito/General",
            Producto = m.Producto?.Nombre ?? "Desconocido",
            Cantidad = Math.Abs(m.Cantidad), // Cantidad en positivo
            Motivo = m.Observaciones
        }).ToList();
    }
}
