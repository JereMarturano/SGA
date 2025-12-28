using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace SGA.Models;

public class DetallePedido
{
    [Key]
    public int DetalleId { get; set; }

    public int PedidoId { get; set; }
    [ForeignKey("PedidoId")]
    [JsonIgnore]
    public Pedido? Pedido { get; set; }

    public int ProductoId { get; set; }
    [ForeignKey("ProductoId")]
    public Producto? Producto { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Cantidad { get; set; }

    [MaxLength(50)]
    public string Unidad { get; set; } = "Unidad"; // Maple, Cajon, Unidad

    [Column(TypeName = "decimal(18,2)")]
    public decimal PrecioUnitario { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Subtotal => Cantidad * PrecioUnitario;
}
