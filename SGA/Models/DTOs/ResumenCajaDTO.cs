using SGA.Models.Enums;

namespace SGA.Models.DTOs;

public class ResumenCajaDTO
{
    public decimal TotalEsperado { get; set; }
    public decimal TotalVentas { get; set; }
    public decimal DineroEnCajaEsperado { get; set; } // Solo Efectivo
    public List<MetodoPagoResumenDTO> DesglosePorMetodoPago { get; set; } = new();
}

public class MetodoPagoResumenDTO
{
    public string MetodoPago { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public int CantidadVentas { get; set; }
}
