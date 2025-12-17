using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGA.Models;

public class ContenidoSilo
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int SiloId { get; set; }
    [ForeignKey("SiloId")]
    public Silo? Silo { get; set; }

    [Required]
    [MaxLength(100)]
    public string NombreMaterial { get; set; } = string.Empty; // Maiz, Soja, Nucleo

    [Column(TypeName = "decimal(18,2)")]
    public decimal Cantidad { get; set; }

    [MaxLength(20)]
    public string UnidadMedida { get; set; } = "Kg"; // Kg, Ton

    [Column(TypeName = "decimal(18,2)")]
    public decimal CostoPorUnidad { get; set; }

    public DateTime UltimaActualizacion { get; set; } = DateTime.Now;
}
