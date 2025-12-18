using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGA.Models;

public class ProduccionIngrediente
{
    [Key]
    public int ProduccionIngredienteId { get; set; }

    public int ProduccionId { get; set; }
    [ForeignKey("ProduccionId")]
    public Produccion? Produccion { get; set; }

    public int SiloId { get; set; }
    [ForeignKey("SiloId")]
    public Silo? Silo { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal CantidadKg { get; set; }
}
