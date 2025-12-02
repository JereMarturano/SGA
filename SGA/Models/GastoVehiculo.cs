using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SGA.Models.Enums;

namespace SGA.Models;

public class GastoVehiculo
{
    [Key]
    public int GastoId { get; set; }

    public int? VehiculoId { get; set; }
    
    [ForeignKey("VehiculoId")]
    public Vehiculo? Vehiculo { get; set; }

    [Required]
    public DateTime Fecha { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Monto { get; set; }

    [Required]
    public TipoGasto Tipo { get; set; }

    [MaxLength(250)]
    public string? Descripcion { get; set; }

    // Kilometraje al momento del gasto (fundamental para calcular rendimiento de combustible)
    public int? Kilometraje { get; set; }

    // Para gastos de combustible, litros cargados
    [Column(TypeName = "decimal(18,2)")]
    public decimal? LitrosCombustible { get; set; }

    // Usuario que registró el gasto (para auditoría)
    public int? UsuarioId { get; set; } // Quien registra el gasto

    public int? EmpleadoId { get; set; } // Para sueldos: quien recibe el pago
    [ForeignKey("EmpleadoId")]
    public Usuario? Empleado { get; set; }
    
    [ForeignKey("UsuarioId")]
    public Usuario? Usuario { get; set; }
}
