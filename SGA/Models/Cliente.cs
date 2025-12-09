using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SGA.Models.Enums;

namespace SGA.Models;

public class Cliente
{
    [Key]
    public int ClienteId { get; set; }

    [Required]
    [MaxLength(100)]
    public string NombreCompleto { get; set; } = string.Empty;

    [MaxLength(20)]
    [RegularExpression(@"^\d+$", ErrorMessage = "El DNI solo debe contener números")]
    public string? DNI { get; set; }

    [MaxLength(20)]
    [Phone(ErrorMessage = "El formato del teléfono no es válido")]
    public string? Telefono { get; set; }

    [MaxLength(100)]
    [EmailAddress(ErrorMessage = "El email no es válido")]
    public string? Email { get; set; }

    [MaxLength(200)]
    public string Direccion { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? DireccionLocal { get; set; }

    public DateTime FechaCumpleanios { get; set; }

    public bool RequiereFactura { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? PrecioEspecial { get; set; }

    [MaxLength(20)]
    public string Estado { get; set; } = "Activo";

    [Column(TypeName = "decimal(18,2)")]
    public decimal Deuda { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal VentasTotales { get; set; }

    public DateTime? UltimaCompra { get; set; }

    public MetodoPago? MetodoPagoPreferido { get; set; }
}
