namespace SGA.Models.DTOs;

public class ReporteVentaEmpleadoDto
{
    public int UsuarioId { get; set; }
    public string NombreUsuario { get; set; } = string.Empty;
    public decimal TotalDineroVentas { get; set; }
    public decimal CantidadHuevosVendidos { get; set; } // En unidades (un huevo)
    public int CantidadViajes { get; set; }
    public decimal PromedioVentasPorViaje { get; set; }
}
