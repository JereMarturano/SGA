using Microsoft.EntityFrameworkCore;
using SGA.Data;
using SGA.Models;

namespace SGA.Services;

public class RestorationService : IRestorationService
{
    private readonly AppDbContext _context;
    private readonly IVentaService _ventaService;
    private readonly IViajeService _viajeService;

    public RestorationService(AppDbContext context, IVentaService ventaService, IViajeService viajeService)
    {
        _context = context;
        _ventaService = ventaService;
        _viajeService = viajeService;
    }

    public async Task RevertirAccionesUsuarioAsync(int usuarioId, DateTime? desde, string motivo)
    {
        var fechaInicio = desde ?? DateTime.MinValue;

        // 1. Revertir Ventas
        var ventas = await _context.Ventas
            .Where(v => v.UsuarioId == usuarioId && v.Fecha >= fechaInicio && v.Activa)
            .ToListAsync();

        foreach (var venta in ventas)
        {
             await _ventaService.CancelarVentaAsync(venta.VentaId, $"RESTAURACIÓN MASIVA: {motivo}");
        }

        // 2. Cerrar Viajes forzosamente
        var viajes = await _context.Viajes
            .Where(v => v.ChoferId == usuarioId && v.FechaSalida >= fechaInicio && v.Estado == Models.Enums.EstadoViaje.EnCurso)
            .ToListAsync();

        foreach (var viaje in viajes)
        {
            await _viajeService.FinalizarViajeAsync(viaje.ViajeId, $"RESTAURACIÓN MASIVA: {motivo}");
        }

        // 3. Registrar en Historial
        // (Esto ya se hace parcialmente en los servicios individuales, pero podemos agregar una entrada general)
    }
}
