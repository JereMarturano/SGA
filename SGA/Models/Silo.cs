using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGA.Models;

public class Silo
{
    [Key]
    public int SiloId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty; // e.g., "Silo Maíz"

    [Column(TypeName = "decimal(18,2)")]
    public decimal CapacidadKg { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal CantidadActualKg { get; set; }

    // El producto que contiene (Ej: Maíz, Alimento Balanceado)
    public int? ProductoId { get; set; }
    [ForeignKey("ProductoId")]
    public Producto? Producto { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal PrecioPromedioCompra { get; set; }

    [MaxLength(20)]
    public string Estado { get; set; } = "Activo";
}
