using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGA.Models;

public class DetalleCompra
{
    [Key]
    public int DetalleCompraId { get; set; }

    public int CompraId { get; set; }
    
    [ForeignKey("CompraId")]
    public Compra? Compra { get; set; }

    public int ProductoId { get; set; }
    
    [ForeignKey("ProductoId")]
    public Producto? Producto { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Cantidad { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal CostoUnitario { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Subtotal { get; set; }
}
