using System;

namespace SGA.Models;

public class AlertaIgnorada
{
    public int Id { get; set; }
    public string ClaveUnica { get; set; } = string.Empty;
    public DateTime FechaIgnorada { get; set; } = DateTime.UtcNow;
    // Opcional: Si queremos que sea por usuario
    // public int? UsuarioId { get; set; } 
}
