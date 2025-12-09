using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SGA.Helpers;

namespace SGA.Models;

public class Compra
{
    [Key]
    public int CompraId { get; set; }

    public DateTime Fecha { get; set; } = TimeHelper.Now;

    [MaxLength(100)]
    public string? Proveedor { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Total { get; set; }

    public int UsuarioId { get; set; }
    
    [ForeignKey("UsuarioId")]
    public Usuario? Usuario { get; set; }

    public string? Observaciones { get; set; }

    // Path or URL to the generated voucher file
    public string? ComprobantePath { get; set; }

    public List<DetalleCompra> Detalles { get; set; } = new();
}
