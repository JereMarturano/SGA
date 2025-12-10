using System;

namespace SGA.Models.DTOs;

public class VentaSimplificadaDTO
{
    public int VentaId { get; set; }
    public DateTime Fecha { get; set; }
    public string ClienteNombre { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public string MetodoPago { get; set; } = string.Empty;
    public int CantidadItems { get; set; }
}
