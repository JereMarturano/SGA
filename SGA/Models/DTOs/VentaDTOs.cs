using SGA.Models.Enums;

namespace SGA.Models.DTOs;

public class RegistrarVentaRequest
{
    public int ClienteId { get; set; }
    public int UsuarioId { get; set; } // Vendedor
    public int VehiculoId { get; set; }
    public MetodoPago MetodoPago { get; set; }
    public List<ItemVentaDTO> Items { get; set; } = new();
}

public class ItemVentaDTO
{
    public int ProductoId { get; set; }
    public decimal Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
}
