using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGA.Models;

public class StockVehiculo
{
    [Key]
    [Column("Id")]
    public int Id { get; set; }

    [Required]
    [Column("VehiculoId")]
    public int VehiculoId { get; set; }

    [ForeignKey("VehiculoId")]
    public Vehiculo? Vehiculo { get; set; }

    [Required]
    [Column("ProductoId")]
    public int ProductoId { get; set; }

    [ForeignKey("ProductoId")]
    public Producto? Producto { get; set; }

    // Cantidad actual en el vehículo (ej. 50 Maples)
    [Column("Cantidad", TypeName = "decimal(18,2)")]
    public decimal Cantidad { get; set; }

    [Column("UltimaActualizacion")]
    public DateTime UltimaActualizacion { get; set; } = DateTime.UtcNow;
}
