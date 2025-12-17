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

        // 1. Obtener lista de alertas ignoradas (Claves Únicas)
        // Optimizacion: podriamos filtrar por usuario si tuvieramos contexto, pero asumimos global por ahora o todo ignorado
        var ignoradas = await _context.AlertasIgnoradas
                                      .Select(a => a.ClaveUnica)
                                      .ToListAsync();
        var ignoradasSet = new HashSet<string>(ignoradas);

        // 2. Generar Warnings de Stock Bajo (Agregado por Vehículo)
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
                string clave = $"stock_{item.Vehiculo.VehiculoId}";
                if (ignoradasSet.Contains(clave)) continue;

                alertas.Add(new AlertaDTO
                {
                    Id = idCounter++,
                    Titulo = "Stock Crítico Global",
                    Mensaje = $"El vehículo {item.Vehiculo.Marca} {item.Vehiculo.Modelo} (Patente {item.Vehiculo.Patente}) tiene solo {item.TotalMaples:N0} maples en total (Mínimo Global: 15).",
                    Tipo = "Warning",
                    Fecha = TimeHelper.Now, 
                    Icono = "Package",
                    Url = $"/stock-vehiculo/{item.Vehiculo.VehiculoId}",
                    ClaveUnica = clave
                });
            }
        }

        // 3. Clientes con Deuda Alta (> $50,000)
        var clientesDeudores = await _context.Clientes
            .Where(c => c.Deuda > 50000)
            .ToListAsync();

        foreach (var cliente in clientesDeudores)
        {
            string clave = $"deuda_{cliente.ClienteId}";
            if (ignoradasSet.Contains(clave)) continue;

            alertas.Add(new AlertaDTO
            {
                Id = idCounter++,
                Titulo = "Deuda Alta",
                Mensaje = $"El cliente {cliente.NombreCompleto} tiene una deuda de ${cliente.Deuda:N2}.",
                Tipo = "Warning",
                Fecha = TimeHelper.Now,
                Icono = "AlertCircle",
                Url = $"/clientes/{cliente.ClienteId}",
                ClaveUnica = clave
            });
        }

        // 4. Clientes Inactivos (Sin compras en 30 días)
        var fechaLimite = TimeHelper.Now.AddDays(-30);
        var clientesInactivos = await _context.Clientes
            .Where(c => c.UltimaCompra < fechaLimite && c.Estado == "Activo")
            .ToListAsync();

        foreach (var cliente in clientesInactivos)
        {
            string clave = $"inactivo_{cliente.ClienteId}";
            if (ignoradasSet.Contains(clave)) continue;

            alertas.Add(new AlertaDTO
            {
                Id = idCounter++,
                Titulo = "Cliente Inactivo",
                Mensaje = $"El cliente {cliente.NombreCompleto} no realiza compras desde hace más de 30 días.",
                Tipo = "Info",
                Fecha = TimeHelper.Now,
                Icono = "UserX",
                Url = $"/clientes/{cliente.ClienteId}",
                ClaveUnica = clave
            });
        }

        // 5. Silos con Stock Bajo (< 500 kg)
        var silosBajos = await _context.Silos
            .Where(s => s.CantidadActualKg < 500 && s.Estado == "Activo")
            .ToListAsync();

        foreach (var silo in silosBajos)
        {
            string clave = $"silo_bajo_{silo.SiloId}";
            if (ignoradasSet.Contains(clave)) continue;

            alertas.Add(new AlertaDTO
            {
                Id = idCounter++,
                Titulo = "Stock Crítico en Silo",
                Mensaje = $"El {silo.Nombre} tiene solo {silo.CantidadActualKg:N2} Kg (Mínimo: 500 Kg).",
                Tipo = "Warning",
                Fecha = TimeHelper.Now,
                Icono = "Database", // or similar
                Url = "/stock-general/silos",
                ClaveUnica = clave
            });
        }

        return alertas.OrderByDescending(a => a.Fecha).ToList();
    }

    private async Task VerificarStockSilos(List<AlertaDTO> alertas, HashSet<string> ignoradasSet, int idCounter)
    {
        // 5. Silos con Stock Bajo (< 500 kg)
        // Note: Modified Method to be part of main flow or helper
    }

    public async Task MarcarComoLeidaAsync(string claveUnica)
    {
        if (string.IsNullOrWhiteSpace(claveUnica)) return;

        // Verificar si ya existe para evitar duplicados
        bool existe = await _context.AlertasIgnoradas.AnyAsync(a => a.ClaveUnica == claveUnica);
        if (!existe)
        {
            _context.AlertasIgnoradas.Add(new AlertaIgnorada
            {
                ClaveUnica = claveUnica,
                FechaIgnorada = TimeHelper.Now
            });
            await _context.SaveChangesAsync();
        }
    }
}
