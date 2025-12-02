using SGA.Models.Enums;

namespace SGA.Models.DTOs;

public class HistorialPagoDTO
{
    public int PagoId { get; set; }
    public string Fecha { get; set; } = string.Empty;
    public decimal Monto { get; set; }
    public string MetodoPago { get; set; } = string.Empty;
    public string? Observacion { get; set; }
}
