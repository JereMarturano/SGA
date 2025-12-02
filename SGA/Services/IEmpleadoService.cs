using SGA.Models;

namespace SGA.Services;

public interface IEmpleadoService
{
    // Absences
    Task<Falta> RegistrarFaltaAsync(int usuarioId, DateTime fecha, string motivo, bool esJustificada);
    Task<List<Falta>> GetFaltasPorEmpleadoAsync(int usuarioId, DateTime? desde, DateTime? hasta);

    // Stats
    Task<EmpleadoEstadisticasDto> GetEstadisticasAsync(int usuarioId, DateTime desde, DateTime hasta);

    // Management
    Task<Usuario> CreateEmpleadoAsync(Models.DTOs.CreateEmpleadoDto dto);
    Task UpdateEmpleadoAsync(int usuarioId, Models.DTOs.UpdateEmpleadoDTO dto);
}

public class EmpleadoEstadisticasDto
{
    public int UsuarioId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public decimal TotalVentas { get; set; } // Dinero
    public int CantidadVentas { get; set; } // Transacciones
    public decimal TotalHuevosVendidos { get; set; } // Unidades (o maples/cajones según unidad)
    public List<VentaPorDiaDto> VentasPorDia { get; set; } = new();
}

public class VentaPorDiaDto
{
    public DateTime Fecha { get; set; }
    public decimal Total { get; set; }
    public decimal HuevosVendidos { get; set; }
}
