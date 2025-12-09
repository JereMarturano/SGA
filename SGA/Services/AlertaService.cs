using Microsoft.EntityFrameworkCore;
using SGA.Data;
using SGA.Models;
using SGA.Helpers;

namespace SGA.Services;

public class AlertaService : IAlertaService
{
    private readonly AppDbContext _context;
    private readonly INotificacionService _notificacionService;

    public AlertaService(AppDbContext context, INotificacionService notificacionService)
    {
        _context = context;
        _notificacionService = notificacionService;
    }

    public async Task<List<AlertaDTO>> ObtenerAlertasOperativasAsync()
    {
        var alertas = new List<AlertaDTO>();
        int idCounter = 1;

        // 1. Obtener Notificaciones de Ventas Recientes (últimas 24h o ultimas 10)
        var notificaciones = await _context.Notificaciones
            .Where(n => n.Tipo == "Venta" && n.FechaCreacion >= TimeHelper.Now.AddDays(-1))
            .OrderByDescending(n => n.FechaCreacion)
            .Take(10)
            .ToListAsync();


        foreach (var notif in notificaciones)
        {
            alertas.Add(new AlertaDTO
            {
                Id = idCounter++,
                Titulo = "Nueva Venta",
                Mensaje = notif.Mensaje,
                Tipo = "Info",
                Fecha = notif.FechaCreacion,
                Icono = "DollarSign"
            });
        }

        // 2. Generar Warnings de Stock Bajo (Agregado por Vehículo)
        // Buscamos vehículos EN RUTA con stock total menor a 15 maples
        var stocksEnRuta = await _context.StockVehiculos
            .Include(s => s.Vehiculo)
            .Include(s => s.Producto)
            .Where(s => s.Vehiculo.EnRuta)
            .ToListAsync();

        var vehiculosCriticos = stocksEnRuta
            .GroupBy(s => s.Vehiculo)
            .Select(g => new 
            {
                Vehiculo = g.Key,
                TotalMaples = g.Where(s => s.Producto.UnidadDeMedida == "Maple").Sum(s => s.Cantidad)
            })
            .Where(x => x.TotalMaples < 15)
            .ToList();

        foreach (var item in vehiculosCriticos)
        {
            if (item.Vehiculo != null)
            {
                alertas.Add(new AlertaDTO
                {
                    Id = idCounter++,
                    Titulo = "Stock Crítico Global",
                    Mensaje = $"El vehículo {item.Vehiculo.Marca} {item.Vehiculo.Modelo} (Patente {item.Vehiculo.Patente}) tiene solo {item.TotalMaples:N0} maples en total (Mínimo Global: 15).",
                    Tipo = "Warning",
                    Fecha = TimeHelper.Now, // Tiempo real
                    Icono = "Package",
                    Url = "/inventario"
                });
            }
        }

        // 3. Clientes con Deuda Alta (> $50,000)
        var clientesDeudores = await _context.Clientes
            .Where(c => c.Deuda > 50000)
            .ToListAsync();

        foreach (var cliente in clientesDeudores)
        {
            alertas.Add(new AlertaDTO
            {
                Id = idCounter++,
                Titulo = "Deuda Alta",
                Mensaje = $"El cliente {cliente.NombreCompleto} tiene una deuda de ${cliente.Deuda:N2}.",
                Tipo = "Warning",
                Fecha = TimeHelper.Now,
                Icono = "AlertCircle",
                Url = $"/clientes/{cliente.ClienteId}"
            });
        }

        // 4. Clientes Inactivos (Sin compras en 30 días)
        var fechaLimite = TimeHelper.Now.AddDays(-30);
        var clientesInactivos = await _context.Clientes
            .Where(c => c.UltimaCompra < fechaLimite && c.Estado == "Activo")
            .ToListAsync();

        foreach (var cliente in clientesInactivos)
        {
            alertas.Add(new AlertaDTO
            {
                Id = idCounter++,
                Titulo = "Cliente Inactivo",
                Mensaje = $"El cliente {cliente.NombreCompleto} no realiza compras desde hace más de 30 días.",
                Tipo = "Info",
                Fecha = TimeHelper.Now,
                Icono = "UserX",
                Url = $"/clientes/{cliente.ClienteId}"
            });
        }

        return alertas.OrderByDescending(a => a.Fecha).ToList();
    }
}
