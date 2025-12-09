using System.ComponentModel.DataAnnotations;

namespace SGA.Models.DTOs;

public class CreateVehiculoDto
{
    [Required]
    [MaxLength(20)]
    public string Patente { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Marca { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Modelo { get; set; } = string.Empty;

    public decimal ConsumoPromedioLts100Km { get; set; }

    public decimal CapacidadCarga { get; set; }

    public int? ID_Chofer_Asignado { get; set; }

    public decimal Kilometraje { get; set; }

    public string Estado { get; set; } = "Activo";

    public DateTime? UltimoCambioAceite { get; set; }

    [MaxLength(50)]
    public string? TipoAceite { get; set; }

    public decimal? KilometrajeProximoCambioAceite { get; set; }

    [MaxLength(20)]
    public string? EstadoCubiertas { get; set; }

    public string? Notas { get; set; }
}

public class UpdateVehiculoDto
{
    [Required]
    [MaxLength(20)]
    public string Patente { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Marca { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Modelo { get; set; } = string.Empty;

    public decimal ConsumoPromedioLts100Km { get; set; }

    public decimal CapacidadCarga { get; set; }

    public int? ID_Chofer_Asignado { get; set; }

    public decimal Kilometraje { get; set; }

    public bool EnRuta { get; set; }

    public string Estado { get; set; } = "Activo";

    public DateTime? UltimoCambioAceite { get; set; }

    [MaxLength(50)]
    public string? TipoAceite { get; set; }

    public decimal? KilometrajeProximoCambioAceite { get; set; }

    [MaxLength(20)]
    public string? EstadoCubiertas { get; set; }

    public string? Notas { get; set; }
}
