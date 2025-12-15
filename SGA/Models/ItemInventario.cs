using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGA.Models;

public class ItemInventario
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(250)]
    public string? Descripcion { get; set; }

    [Required]
    public int UbicacionId { get; set; }
    [ForeignKey("UbicacionId")]
    public Ubicacion? Ubicacion { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Cantidad { get; set; }

    [MaxLength(50)]
    public string UnidadMedida { get; set; } = "Unidades"; // Unidades, Litros, Metros

    [MaxLength(50)]
    public string Categoria { get; set; } = "General"; // Repuesto, Maple, Herramienta
}
