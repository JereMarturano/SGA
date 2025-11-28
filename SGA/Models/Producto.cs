using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SGA.Models.Enums;

namespace SGA.Models;

public class Producto
{
    [Key]
    public int ProductoId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    public TipoProducto TipoProducto { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal StockActual { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal StockMinimoAlerta { get; set; }

    [MaxLength(50)]
    public string UnidadDeMedida { get; set; } = string.Empty;
}
