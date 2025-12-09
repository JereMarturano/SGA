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
    [Range(typeof(decimal), "0", "10000000", ErrorMessage = "El stock debe ser mayor o igual a 0")]
    public decimal StockActual { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    [Range(typeof(decimal), "0", "10000000", ErrorMessage = "El stock mínimo debe ser mayor o igual a 0")]
    public decimal StockMinimoAlerta { get; set; }

    [MaxLength(50)]
    public string UnidadDeMedida { get; set; } = string.Empty;

    // Propiedades específicas para Huevos
    public bool EsHuevo { get; set; }
    public TamanoHuevo? Tamano { get; set; }
    public ColorHuevo? Color { get; set; }
    
    // Cantidad de unidades por bulto (ej. 30 para Maple, 360 para Cajón)
    public int UnidadesPorBulto { get; set; } = 1;

    [Column(TypeName = "decimal(18,2)")]
    public decimal CostoUltimaCompra { get; set; }
}
