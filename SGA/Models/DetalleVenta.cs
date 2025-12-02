using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGA.Models;

public class DetalleVenta
{
    [Key]
    public int DetalleId { get; set; }

    public int VentaId { get; set; }
    [ForeignKey("VentaId")]
    [System.Text.Json.Serialization.JsonIgnore]
    public Venta? Venta { get; set; }

    public int ProductoId { get; set; }
    [ForeignKey("ProductoId")]
    public Producto? Producto { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Cantidad { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal PrecioUnitario { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Subtotal { get; set; }
}
