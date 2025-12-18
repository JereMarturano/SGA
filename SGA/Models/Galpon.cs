using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGA.Models;

public class Galpon
{
    [Key]
    public int GalponId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty; // e.g., "Galpón 1"

    [Required]
    [MaxLength(50)]
    public string Tipo { get; set; } = "Produccion"; // "Produccion" or "Pollitos"

    public int CantidadAves { get; set; }

    public DateTime FechaAlta { get; set; } = DateTime.Now;

    public DateTime? FechaBajaEstimada { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal PrecioCompraAve { get; set; }

    [MaxLength(20)]
    public string Estado { get; set; } = "Activo"; // "Activo", "Inactivo", "Limpieza"
}
