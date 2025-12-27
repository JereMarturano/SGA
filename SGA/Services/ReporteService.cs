using Microsoft.EntityFrameworkCore;
using SGA.Data;
using SGA.Models.DTOs;
using SGA.Models;
using SGA.Models.Enums;

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
        // Asegurar rango de fechas correcto
        // Trabajamos con Fechas "Unspecified" (Local Argentina) ya que así se guardan en la BD vía TimeHelper
        var inicio = fechaInicio.Date; 
        var fin = fechaFin.Date.AddDays(1).AddTicks(-1);

        // 1. Consultar Ventas
        var queryVentas = _context.Ventas
            .Include(v => v.Cliente) 
            .Include(v => v.Usuario) 
            .Include(v => v.Detalles)
            .ThenInclude(d => d.Producto)
            .Where(v => v.Fecha >= inicio && v.Fecha <= fin && v.Activa); // Solo ventas activas

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
        
        // 3.1 Calcular Compras de Inventario (Cash Flow)
        var totalCompras = await _context.Compras
            .Where(c => c.Fecha >= inicio && c.Fecha <= fin)
            .SumAsync(c => c.Total);

        // 3.2 Calcular Costo de Mercadería Vendida (CMV) - Aproximación por Costo Última Compra
        // 3.2 Calcular Costo de Mercadería Vendida (CMV) - SQL Directo
        var queryDetalles = _context.DetallesVenta
            .Include(d => d.Producto)
            .Where(d => d.Venta.Fecha >= inicio && d.Venta.Fecha <= fin && d.Venta.Activa);

        if (vehiculoId.HasValue)
        {
             queryDetalles = queryDetalles.Where(d => d.Venta.VehiculoId == vehiculoId.Value);
        }

        var totalCostoMercaderia = await queryDetalles
            .SumAsync(d => d.Cantidad * (
                (d.Producto != null && d.Producto.CostoUltimaCompra > 0)
                ? d.Producto.CostoUltimaCompra 
                : (d.PrecioUnitario * 0.7m)
            ));

        // 3.3 Calcular Pérdida por Mermas (General y de Vehículos)
        var queryMermas = _context.MovimientosStock
             .Include(m => m.Producto)
             .Where(m => m.TipoMovimiento == TipoMovimientoStock.Merma && m.Fecha >= inicio && m.Fecha <= fin);

        if (vehiculoId.HasValue)
        {
            queryMermas = queryMermas.Where(m => m.VehiculoId == vehiculoId.Value);
        }

        var totalPerdidaMermas = await queryMermas.SumAsync(m => 
            Math.Abs(m.Cantidad) * (
                (m.Producto != null && m.Producto.CostoUltimaCompra > 0)
                ? m.Producto.CostoUltimaCompra 
                : (m.Producto != null ? m.Producto.PrecioSugerido * 0.7m : 0)
            ));

        var totalVentas = ventas.Sum(v => v.Total);
        var totalGastos = gastos.Sum(g => g.Monto);

        var reporte = new ReporteFinancieroDTO
        {
            FechaInicio = inicio,
            FechaFin = fin,
            TotalVentas = totalVentas,
            TotalCostoMercaderia = totalCostoMercaderia,
            TotalCompras = totalCompras,
            TotalGastos = totalGastos,
            TotalPerdidaMermas = totalPerdidaMermas,
            CantidadVentas = ventas.Count,
            GananciaNeta = totalVentas - totalCostoMercaderia - totalGastos - totalPerdidaMermas
        };

        // Cálculos derivados
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

        // Top Clientes
        // Solo incluimos ventas con ClienteId > 0
        reporte.TopClientes = ventas
            .Where(v => v.ClienteId > 0)
            .GroupBy(v => v.ClienteId)
            .Select(g => new VentaPorClienteDTO
            {
                ClienteId = g.Key,
                NombreCliente = g.First().Cliente?.NombreCompleto ?? $"Cliente #{g.Key}",
                TotalComprado = g.Sum(v => v.Total),
                CantidadCompras = g.Count()
            })
            .OrderByDescending(x => x.TotalComprado)
            .Take(10)
            .ToList();

        // Ventas por Vendedor
        reporte.VentasPorVendedor = ventas
            .Where(v => v.UsuarioId > 0)
            .GroupBy(v => v.UsuarioId)
            .Select(g => new VentaPorVendedorDTO
            {
                UsuarioId = g.Key,
                NombreVendedor = g.First().Usuario?.Nombre ?? $"Usuario #{g.Key}",
                TotalVendido = g.Sum(v => v.Total),
                CantidadVentas = g.Count()
            })
            .OrderByDescending(x => x.TotalVendido)
            .ToList();

        // Deuda Total Actual (Snapshot global)
        reporte.DeudaTotalActual = await _context.Clientes.SumAsync(c => c.Deuda);

        // Por Dia (Tendencia)
        var ventasPorDia = new List<VentaDiariaDTO>();
        // Iteramos por cada dia en el rango para asegurar que tenemos un punto de dato por dia, incluso si es 0.
        // Convertimos a Date para iterar sin horas
        for (var day = inicio.Date; day <= fin.Date; day = day.AddDays(1))
        {
            // Filtramos ventas que ocurrieron en ese dia (comparando fecha local o UTC segun corresponda, aqui simplificamos a Date)
            var totalDia = ventas
                .Where(v => v.Fecha.Date == day)
                .Sum(v => v.Total);

            ventasPorDia.Add(new VentaDiariaDTO
            {
                Fecha = day.ToString("yyyy-MM-dd"),
                Total = totalDia
            });
        }
        reporte.VentasPorDia = ventasPorDia;

        reporte.VentasPorDia = ventasPorDia;

        // 5. Comparaciones (vs Mes Anterior)
        // Definir periodo anterior (mismo rango pero mes anterior)
        var prevInicio = inicio.AddMonths(-1);
        var prevFin = fin.AddMonths(-1);

        // Consultar Ventas Periodo Anterior
        var prevVentasTotal = await _context.Ventas
            .Where(v => v.Fecha >= prevInicio && v.Fecha <= prevFin)
            .SumAsync(v => v.Total);

        // Consultar Gastos Periodo Anterior
        var prevGastosTotal = await _context.GastosVehiculos
            .Where(g => g.Fecha >= prevInicio && g.Fecha <= prevFin)
            .SumAsync(g => g.Monto);

        // Consultar CMV Periodo Anterior (Aproximado)
        // Nota: Para hacerlo exacto deberíamos consultar los detalles, pero para rendimiento hacemos una query simplificada
        // O bien, replicamos la logica de CMV actual
        var prevVentasDetalles = await _context.Ventas
            .Include(v => v.Detalles)
            .ThenInclude(d => d.Producto)
            .Where(v => v.Fecha >= prevInicio && v.Fecha <= prevFin)
            .SelectMany(v => v.Detalles)
            .ToListAsync();

        var prevCostoMercaderia = prevVentasDetalles
            .Sum(d => d.Cantidad * (d.Producto?.CostoUltimaCompra ?? 0));

        var prevGananciaNeta = prevVentasTotal - prevCostoMercaderia - prevGastosTotal;
        
        // Calcular Margen Anterior
        var prevMargenPorcentaje = prevVentasTotal > 0 
            ? (prevGananciaNeta / prevVentasTotal) * 100 
            : 0;

        // Calcular Variaciones
        // Variacion Ventas
        if (prevVentasTotal == 0)
        {
            reporte.VariacionVentas = reporte.TotalVentas > 0 ? 100 : 0;
        }
        else
        {
            reporte.VariacionVentas = ((reporte.TotalVentas - prevVentasTotal) / prevVentasTotal) * 100;
        }
        reporte.TendenciaVentasPositiva = reporte.VariacionVentas >= 0;

        // Variacion Margen
        if (prevMargenPorcentaje == 0)
        {
            reporte.VariacionMargen = reporte.MargenGananciaPorcentaje > 0 ? 100 : 0;
        }
        else
        {
            reporte.VariacionMargen = ((reporte.MargenGananciaPorcentaje - prevMargenPorcentaje) / prevMargenPorcentaje) * 100;
        }
        reporte.TendenciaMargenPositiva = reporte.VariacionMargen >= 0;

        return reporte;
    }
    public async Task<List<StockEnCalleDTO>> ObtenerStockEnCalleAsync()
    {
        var vehiculos = await _context.Vehiculos
            .Include(v => v.ChoferAsignado) 
            .ToListAsync();

        var stockVehiculos = await _context.StockVehiculos
            .Include(s => s.Producto)
            .ToListAsync();

        // 1. Obtener viajes activos (EnCurso)
        var viajesActivos = await _context.Viajes
            .Include(v => v.Chofer)
            .Where(v => v.Estado == EstadoViaje.EnCurso)
            .ToListAsync();

        var activeViajeIds = viajesActivos.Select(v => v.ViajeId).ToList();

        // 2. Obtener ventas de esos viajes activos
        var ventasViajes = await _context.Ventas
            .Include(v => v.Cliente)
            .Include(v => v.Detalles) // Para contar items
            .Where(v => v.ViajeId.HasValue && activeViajeIds.Contains(v.ViajeId.Value) && v.Activa)
            .OrderByDescending(v => v.Fecha)
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

            var dto = new StockEnCalleDTO
            {
                VehiculoId = vehiculo.VehiculoId,
                VehiculoNombre = $"{vehiculo.Marca} {vehiculo.Modelo} ({vehiculo.Patente})",
                EnRuta = vehiculo.EnRuta,
                Kilometraje = vehiculo.Kilometraje,
                Stock = stockDelVehiculo,
                ChoferNombre = vehiculo.ChoferAsignado?.Nombre // Default fallback
            };

            // Lógica para viaje activo
            if (vehiculo.EnRuta)
            {
                var viaje = viajesActivos.FirstOrDefault(v => v.VehiculoId == vehiculo.VehiculoId);
                if (viaje != null)
                {
                    dto.ChoferNombre = viaje.Chofer?.Nombre ?? dto.ChoferNombre ?? "Desconocido";

                    var ventasTrip = ventasViajes.Where(v => v.ViajeId == viaje.ViajeId).ToList();

                    var ultimaVenta = ventasTrip.FirstOrDefault(); // Ordenado por fecha desc en la query

                    if (ultimaVenta != null)
                    {
                        dto.UltimaVentaFecha = ultimaVenta.Fecha;
                        dto.UltimaVentaTotal = ultimaVenta.Total;
                        dto.UltimaVentaCliente = ultimaVenta.Cliente?.NombreCompleto ?? "Cliente Eliminado";
                    }

                    dto.HistorialVentas = ventasTrip.Select(v => new VentaSimplificadaDTO
                    {
                        VentaId = v.VentaId,
                        Fecha = v.Fecha,
                        ClienteNombre = v.Cliente?.NombreCompleto ?? "Desconocido",
                        Total = v.Total,
                        MetodoPago = v.MetodoPago.ToString(),
                        CantidadItems = v.Detalles.Count
                    }).ToList();
                }
            }

            resultado.Add(dto);
        }

        return resultado;
    }

    public async Task<List<MermaReporteDTO>> ObtenerHistorialMermasAsync()
    {
        var mermas = await _context.MovimientosStock
            .Include(m => m.Usuario)
            .Include(m => m.Vehiculo)
            .Include(m => m.Producto)
            .Where(m => m.TipoMovimiento == TipoMovimientoStock.Merma)
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
