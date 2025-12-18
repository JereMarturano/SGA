using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGA.Models;

public class EventoMortalidad
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int LoteId { get; set; }
    [ForeignKey("LoteId")]
    public LoteAve? Lote { get; set; }

    [Required]
    public DateTime Fecha { get; set; }

    [Required]
    public int Cantidad { get; set; }

    [MaxLength(200)]
    public string? Motivo { get; set; }

    // Usuario que registro la baja
    public int? UsuarioId { get; set; }
}
