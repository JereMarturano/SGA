using SGA.Models.Enums;

namespace SGA.Models.DTOs;

public class UpdateEmpleadoDTO
{
    public string Nombre { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty; // Frontend sends string "Vendedor", "Chofer" etc.
    public string DNI { get; set; } = string.Empty;
    public string? Password { get; set; } // Optional, only if changing
    public string? Telefono { get; set; }
    public DateTime FechaIngreso { get; set; }
    public string Estado { get; set; } = "Activo";
}
