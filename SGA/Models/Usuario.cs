using System.ComponentModel.DataAnnotations;
using SGA.Models.Enums;

namespace SGA.Models;

public class Usuario
{
    [Key]
    public int UsuarioId { get; set; }

    [Required]
    [MaxLength(100)]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "El nombre debe tener al menos 3 caracteres")]
    public string Nombre { get; set; } = string.Empty;

    public RolUsuario Rol { get; set; }

    [Required]
    public string ContrasenaHash { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Telefono { get; set; }

    public DateTime FechaIngreso { get; set; } = DateTime.Now;

    [MaxLength(20)]
    public string Estado { get; set; } = "Activo";
}
