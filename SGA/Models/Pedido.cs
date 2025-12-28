using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SGA.Models.Enums;

namespace SGA.Models;

public class Pedido
{
    [Key]
    public int PedidoId { get; set; }

    [Required]
    public int ClienteId { get; set; }
    [ForeignKey("ClienteId")]
    public Cliente? Cliente { get; set; }

    public DateTime FechaPedido { get; set; } = DateTime.Now;
    
    public DateTime? FechaEntrega { get; set; }

    public EstadoPedido Estado { get; set; } = EstadoPedido.Pendiente;

    public int? ViajeId { get; set; }
    [ForeignKey("ViajeId")]
    public Viaje? Viaje { get; set; }

    public string? Observaciones { get; set; }
    
    public bool EstaPagado { get; set; } = false;

    public List<DetallePedido> Detalles { get; set; } = new();

    // Helper to calculate total value if needed, though mostly for display or proforma
    [NotMapped]
    public decimal TotalEstimado => Detalles?.Sum(d => d.Subtotal) ?? 0;
}
