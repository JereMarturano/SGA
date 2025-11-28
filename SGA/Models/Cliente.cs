using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGA.Models;

public class Cliente
{
    [Key]
    public int ClienteId { get; set; }

    [Required]
    [MaxLength(100)]
    public string NombreCompleto { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string DNI { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Telefono { get; set; } = string.Empty;

    [MaxLength(100)]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [MaxLength(200)]
    public string Direccion { get; set; } = string.Empty;

    public DateTime FechaCumpleanios { get; set; }

    public bool RequiereFactura { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? PrecioEspecial { get; set; }
}
