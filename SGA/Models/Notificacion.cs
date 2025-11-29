using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGA.Models;

public class Notificacion
{
    [Key]
    public int NotificacionId { get; set; }

    [Required]
    public string Mensaje { get; set; } = string.Empty;

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public bool Leido { get; set; } = false;

    // Opcional: Para categorizar la notificación (Venta, Stock, Sistema, etc.)
    public string Tipo { get; set; } = "General";

    // Opcional: Si queremos dirigirla a un usuario específico en el futuro
    public int? UsuarioId { get; set; }
    
    [ForeignKey("UsuarioId")]
    public Usuario? Usuario { get; set; }
}
