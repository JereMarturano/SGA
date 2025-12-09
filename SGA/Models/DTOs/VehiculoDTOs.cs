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
}
