using Microsoft.EntityFrameworkCore;
using SGA.Data;
using SGA.Models;

namespace SGA.Services;

public class CierreCajaService : ICierreCajaService
{
    private readonly AppDbContext _context;

    public CierreCajaService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<CierreCajaDiario> CalcularResumen(DateTime fecha)
    {
        var fechaInicio = fecha.Date;
        var fechaFin = fecha.Date.AddDays(1).AddTicks(-1);

        // 1. Total Ventas (solo ventas activas)
        var ventasDelDia = _context.Ventas
            .Where(v => v.Fecha >= fechaInicio && v.Fecha <= fechaFin && v.Activa);

        decimal totalVentas = await ventasDelDia.SumAsync(v => v.Total);

        // 2. Total Gastos
        var gastosDelDia = _context.GastosVehiculos
            .Where(g => g.Fecha >= fechaInicio && g.Fecha <= fechaFin);

        decimal totalGastos = await gastosDelDia.SumAsync(g => g.Monto);

        // 3. Cantidad de Huevos Vendidos
        // Sumamos la cantidad de los detalles de venta donde el producto es huevo
        decimal totalHuevos = await ventasDelDia
            .SelectMany(v => v.Detalles)
            .Where(d => d.Producto != null && d.Producto.EsHuevo)
            .SumAsync(d => d.Cantidad);

        var cierre = new CierreCajaDiario
        {
            Fecha = fechaInicio,
            TotalVentas = totalVentas,
            TotalGastos = totalGastos,
            TotalHuevosVendidos = totalHuevos,
            SaldoNeto = totalVentas - totalGastos
        };

        return cierre;
    }

    public async Task<CierreCajaDiario> CerrarCaja(CierreCajaDiario cierre, int usuarioId)
    {
        // Verificar si ya existe cierre para esa fecha
        var existe = await _context.CierresCajaDiarios
            .AnyAsync(c => c.Fecha.Date == cierre.Fecha.Date);

        if (existe)
        {
            throw new InvalidOperationException($"Ya existe un cierre de caja para la fecha {cierre.Fecha.ToShortDateString()}");
        }

        cierre.UsuarioId = usuarioId;
        cierre.FechaCierre = DateTime.Now;
        // Recalcular saldo por seguridad
        cierre.SaldoNeto = cierre.TotalVentas - cierre.TotalGastos;

        _context.CierresCajaDiarios.Add(cierre);
        await _context.SaveChangesAsync();

        return cierre;
    }

    public async Task<IEnumerable<CierreCajaDiario>> ObtenerHistorial()
    {
        return await _context.CierresCajaDiarios
            .Include(c => c.Usuario)
            .OrderByDescending(c => c.Fecha)
            .ToListAsync();
    }

    public async Task<bool> ExisteCierre(DateTime fecha)
    {
        return await _context.CierresCajaDiarios
            .AnyAsync(c => c.Fecha.Date == fecha.Date);
    }
}
