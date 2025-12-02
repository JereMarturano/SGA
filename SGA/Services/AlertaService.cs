using Microsoft.EntityFrameworkCore;
using SGA.Data;
using SGA.Models;

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
            .Where(n => n.Tipo == "Venta" && n.FechaCreacion >= DateTime.UtcNow.AddDays(-1))
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

        // 2. Generar Warnings de Stock Bajo
        // Buscamos items con stock menor a 10 en vehículos
        var stockCritico = await _context.StockVehiculos
            .Include(s => s.Vehiculo)
            .Include(s => s.Producto)
            .Where(s => s.Cantidad < 10)
            .ToListAsync();

        foreach (var stock in stockCritico)
        {
            if (stock.Vehiculo != null && stock.Producto != null)
            {
                alertas.Add(new AlertaDTO
                {
                    Id = idCounter++,
                    Titulo = "Stock Crítico",
                    Mensaje = $"El vehículo {stock.Vehiculo.Marca} {stock.Vehiculo.Modelo} (Patente {stock.Vehiculo.Patente}) tiene solo {stock.Cantidad} {stock.Producto.UnidadDeMedida} de {stock.Producto.Nombre}.",
                    Tipo = "Warning",
                    Fecha = DateTime.UtcNow, // Tiempo real
                    Icono = "Package"
                });
            }
        }

        // 3. Generar Warnings de Vehículos En Ruta sin movimiento reciente (Opcional, ejemplo)
        // Por ahora nos basamos en stock como pidió el usuario "situaciones en la que parezca importante"
        // Podríamos agregar deuda de clientes excesiva, etc.

        return alertas.OrderByDescending(a => a.Fecha).ToList();
    }
}
