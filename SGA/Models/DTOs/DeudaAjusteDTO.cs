using System.ComponentModel.DataAnnotations;

namespace SGA.Models.DTOs;

public class DeudaAjusteDTO
{
    [Required]
    public decimal Monto { get; set; }

    [Required]
    public bool EsAumento { get; set; } // true = Add Debt, false = Reduce Debt (Manual Adjustment)

    [Required]
    public string Motivo { get; set; } = string.Empty;
}
