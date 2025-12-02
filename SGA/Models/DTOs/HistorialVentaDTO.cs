using SGA.Models.Enums;

namespace SGA.Models.DTOs;

public class HistorialVentaDTO
{
    public int VentaId { get; set; }
    public string Fecha { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public string MetodoPago { get; set; } = string.Empty;
    public string Vendedor { get; set; } = string.Empty;
    public List<DetalleVentaHistorialDTO> Productos { get; set; } = new();
}

public class DetalleVentaHistorialDTO
{
    public string Producto { get; set; } = string.Empty;
    public decimal Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Subtotal { get; set; }
}
