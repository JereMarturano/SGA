namespace SGA.Models.DTOs;

public class CargaVehiculoRequest
{
    public int VehiculoId { get; set; }
    public int UsuarioId { get; set; } // El Admin que realiza la carga
    public int? ChoferId { get; set; } // El chofer asignado
    public List<ItemCarga> Items { get; set; } = new();
}

public class ItemCarga
{
    public int ProductoId { get; set; }
    public decimal Cantidad { get; set; }
}

public class MermaRequest
{
    public int VehiculoId { get; set; }
    public int ProductoId { get; set; }
    public decimal Cantidad { get; set; }
    public int UsuarioId { get; set; }
    public string Motivo { get; set; } = string.Empty;
}

public class CompraRequest
{
    public int UsuarioId { get; set; }
    public string? Proveedor { get; set; }
    public string Observaciones { get; set; } = string.Empty;
    public List<ItemCompra> Items { get; set; } = new();
}

public class ItemCompra
{
    public int ProductoId { get; set; }
    public decimal Cantidad { get; set; }
    public decimal CostoUnitario { get; set; }
}

public class CerrarRepartoRequest
{
    public int VehiculoId { get; set; }
    public int UsuarioId { get; set; }
    public decimal NuevoKilometraje { get; set; }
    public List<StockRetornoItem> StockRetorno { get; set; } = new();
}

public class StockRetornoItem
{
    public int ProductoId { get; set; }
    public decimal CantidadFisica { get; set; }
}

public class MermaGeneralRequest
{
    public int ProductoId { get; set; }
    public decimal Cantidad { get; set; }
    public bool EsMaple { get; set; }
    public int UsuarioId { get; set; }
    public string Motivo { get; set; } = string.Empty;
}
