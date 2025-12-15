using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SGA.Models.Enums;

namespace SGA.Models;

public class LoteAve
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UbicacionId { get; set; }
    [ForeignKey("UbicacionId")]
    public Ubicacion? Ubicacion { get; set; }

    [Required]
    public TipoAve TipoAve { get; set; } // Gallina or Pollito

    public int CantidadInicial { get; set; }

    public int CantidadActual { get; set; }

    [Required]
    public DateTime FechaAlta { get; set; }

    public DateTime? FechaBaja { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal PrecioCompra { get; set; }

    public bool Activo { get; set; } = true;
}
