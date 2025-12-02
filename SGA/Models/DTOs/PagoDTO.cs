using SGA.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace SGA.Models.DTOs;

public class PagoDTO
{
    [Required]
    public decimal Monto { get; set; }

    [Required]
    public MetodoPago MetodoPago { get; set; }

    public string? Observacion { get; set; }
}
