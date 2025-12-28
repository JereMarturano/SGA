namespace SGA.Models.DTOs;

public class AjusteStockCierreDto
{
    public int ProductoId { get; set; }
    public decimal CantidadTeorica { get; set; }
    public decimal CantidadReal { get; set; }
}
