using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGA.Models;

public class EventoGalpon
{
    [Key]
    public int EventoId { get; set; }

    [Required]
    public int GalponId { get; set; }
    [ForeignKey("GalponId")]
    public Galpon? Galpon { get; set; }

    [Required]
    public DateTime Fecha { get; set; } = DateTime.Now;

    [Required]
    [MaxLength(50)]
    public string TipoEvento { get; set; } = string.Empty; // "Muerte", "Ingreso", "Egreso", "Vacunacion"

    public int Cantidad { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Costo { get; set; }

    public int? ProductoId { get; set; }
    [ForeignKey("ProductoId")]
    public Producto? Producto { get; set; }

    [MaxLength(250)]
    public string? Observacion { get; set; }

    public int UsuarioId { get; set; }
    [ForeignKey("UsuarioId")]
    public Usuario? Usuario { get; set; }
}
