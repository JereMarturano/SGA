using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SGA.Models.Enums;

namespace SGA.Models;

public class Venta
{
    [Key]
    public int VentaId { get; set; }

    [Required]
    public DateTime Fecha { get; set; }

    [Required]
    public int ClienteId { get; set; }
    [ForeignKey("ClienteId")]
    public Cliente? Cliente { get; set; }

    [Required]
    public int UsuarioId { get; set; } // Vendedor/Chofer
    [ForeignKey("UsuarioId")]
    public Usuario? Usuario { get; set; }

    [Required]
    public int VehiculoId { get; set; } // Desde qué vehículo se vendió
    [ForeignKey("VehiculoId")]
    public Vehiculo? Vehiculo { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Total { get; set; }

    public MetodoPago MetodoPago { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal DescuentoPorcentaje { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal DescuentoMonto { get; set; }

    // Lista de items vendidos
    public List<DetalleVenta> Detalles { get; set; } = new();
}
