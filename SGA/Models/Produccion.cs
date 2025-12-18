using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGA.Models;

public class Produccion
{
    [Key]
    public int ProduccionId { get; set; }

    [Required]
    public DateTime Fecha { get; set; } = DateTime.Now;

    // List of ingredients used in this production
    public ICollection<ProduccionIngrediente> Ingredientes { get; set; } = new List<ProduccionIngrediente>();

    // Silo destino (si se produjo alimento y se guardó en otro silo)
    public int? SiloDestinoId { get; set; }
    [ForeignKey("SiloDestinoId")]
    public Silo? SiloDestino { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal CantidadKg { get; set; }

    [MaxLength(250)]
    public string? Observacion { get; set; }
    
    public int UsuarioId { get; set; }
    [ForeignKey("UsuarioId")]
    public Usuario? Usuario { get; set; }
}
