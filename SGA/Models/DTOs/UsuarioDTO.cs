using SGA.Models.Enums;

namespace SGA.Models.DTOs;

public class UsuarioDTO
{
    public int UsuarioId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public DateTime FechaIngreso { get; set; }
    public string Estado { get; set; } = "Activo";
    public decimal VentasDelMes { get; set; }
    public int FaltasDelMes { get; set; }
}
