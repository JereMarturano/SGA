using System.ComponentModel.DataAnnotations;
using SGA.Models.Enums;

namespace SGA.Models;

public class Usuario
{
    [Key]
    public int UsuarioId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    public RolUsuario Rol { get; set; }

    [Required]
    public string ContrasenaHash { get; set; } = string.Empty;
}
