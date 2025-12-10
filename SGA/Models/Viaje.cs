using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SGA.Models.Enums;

namespace SGA.Models;

public class Viaje
{
    [Key]
    public int ViajeId { get; set; }

    public int VehiculoId { get; set; }

    [ForeignKey("VehiculoId")]
    public Vehiculo? Vehiculo { get; set; }

    public int ChoferId { get; set; } // UsuarioId del Chofer

    [ForeignKey("ChoferId")]
    public Usuario? Chofer { get; set; }

    public DateTime FechaSalida { get; set; }
    
    public DateTime? FechaRegreso { get; set; }

    public EstadoViaje Estado { get; set; } = EstadoViaje.EnCurso;

    public string? Observaciones { get; set; }
}
