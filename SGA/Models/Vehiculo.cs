using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGA.Models;

public class Vehiculo
{
    [Key]
    public int VehiculoId { get; set; }

    [Required(ErrorMessage = "La patente es obligatoria")]
    [MaxLength(20)]
    [RegularExpression(@"^[A-Z]{2,3}\d{3}[A-Z]{0,2}$", ErrorMessage = "El formato de la patente no es válido")]
    public string Patente { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Marca { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Modelo { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    [Range(typeof(decimal), "0", "100", ErrorMessage = "El consumo debe estar entre 0 y 100")]
    public decimal ConsumoPromedioLts100Km { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    [Range(typeof(decimal), "0", "20000", ErrorMessage = "La capacidad de carga debe estar entre 0 y 20000")]
    public decimal CapacidadCarga { get; set; }

    [Column("ID_Chofer_Asignado")]
    public int? ID_Chofer_Asignado { get; set; }

    [ForeignKey("ID_Chofer_Asignado")]
    public Usuario? ChoferAsignado { get; set; }

    public bool EnRuta { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    [Range(typeof(decimal), "0", "2000000", ErrorMessage = "El kilometraje debe ser mayor o igual a 0")]
    public decimal Kilometraje { get; set; }

    public string Estado { get; set; } = "Activo";

    public DateTime? UltimoCambioAceite { get; set; }

    [MaxLength(50)]
    public string? TipoAceite { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? KilometrajeProximoCambioAceite { get; set; }

    [MaxLength(20)]
    public string? EstadoCubiertas { get; set; }

    public string? Notas { get; set; }
}
