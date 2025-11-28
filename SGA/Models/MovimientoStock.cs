using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SGA.Models.Enums;

namespace SGA.Models;

public class MovimientoStock
{
    [Key]
    public int MovimientoId { get; set; }

    [Required]
    public DateTime Fecha { get; set; }

    [Required]
    public TipoMovimientoStock TipoMovimiento { get; set; }

    // Origen del movimiento (puede ser nulo si es una compra externa)
    public int? VehiculoId { get; set; }
    [ForeignKey("VehiculoId")]
    public Vehiculo? Vehiculo { get; set; }

    [Required]
    public int ProductoId { get; set; }
    [ForeignKey("ProductoId")]
    public Producto? Producto { get; set; }

    // Cantidad movida (positiva para entradas, negativa para salidas)
    [Column(TypeName = "decimal(18,2)")]
    public decimal Cantidad { get; set; }

    // Usuario que registró el movimiento
    public int UsuarioId { get; set; }
    [ForeignKey("UsuarioId")]
    public Usuario? Usuario { get; set; }

    [MaxLength(250)]
    public string? Observaciones { get; set; }
}
