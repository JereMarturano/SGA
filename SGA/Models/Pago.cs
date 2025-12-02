using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SGA.Models.Enums;

namespace SGA.Models;

public class Pago
{
    [Key]
    public int PagoId { get; set; }

    [Required]
    public int ClienteId { get; set; }
    [ForeignKey("ClienteId")]
    public Cliente? Cliente { get; set; }

    public DateTime Fecha { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Monto { get; set; }

    public MetodoPago MetodoPago { get; set; }

    [MaxLength(200)]
    public string? Observacion { get; set; }
}
