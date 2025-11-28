using SGA.Models.Enums;

namespace SGA.Models.DTOs;

public class ReporteFinancieroDTO
{
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    
    // Resumen General
    public decimal TotalVentas { get; set; }
    public decimal TotalGastos { get; set; }
    public decimal GananciaNeta { get; set; } // Ventas - Gastos
    public decimal MargenGananciaPorcentaje { get; set; }

    // Desgloses
    public List<VentaPorMetodoPagoDTO> VentasPorMetodoPago { get; set; } = new();
    public List<VentaPorProductoDTO> VentasPorProducto { get; set; } = new();
    public List<GastoPorTipoDTO> GastosPorTipo { get; set; } = new();
    
    // Métricas Operativas
    public int CantidadVentas { get; set; }
    public decimal TicketPromedio { get; set; }
}

public class VentaPorMetodoPagoDTO
{
    public MetodoPago MetodoPago { get; set; }
    public decimal Total { get; set; }
    public int CantidadTransacciones { get; set; }
}

public class VentaPorProductoDTO
{
    public int ProductoId { get; set; }
    public string NombreProducto { get; set; } = string.Empty;
    public decimal CantidadVendida { get; set; }
    public decimal TotalGenerado { get; set; }
}

public class GastoPorTipoDTO
{
    public TipoGasto TipoGasto { get; set; }
    public decimal Total { get; set; }
    public int CantidadRegistros { get; set; }
}
