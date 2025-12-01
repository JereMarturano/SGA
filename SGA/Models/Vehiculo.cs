using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGA.Models;

public class Vehiculo
{
    [Key]
    public int VehiculoId { get; set; }

    [Required]
    [MaxLength(20)]
    public string Patente { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Marca { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Modelo { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal ConsumoPromedioLts100Km { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal CapacidadCarga { get; set; }

    [Column("ID_Chofer_Asignado")]
    public int? ID_Chofer_Asignado { get; set; }

    [ForeignKey("ID_Chofer_Asignado")]
    public Usuario? ChoferAsignado { get; set; }

    public bool EnRuta { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Kilometraje { get; set; }
}
