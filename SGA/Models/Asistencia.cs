using System.ComponentModel.DataAnnotations;

namespace SGA.Models;

public class Asistencia
{
    [Key]
    public int AsistenciaId { get; set; }

    public int UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }

    public DateTime Fecha { get; set; }

    public bool EstaPresente { get; set; } = true;

    // Optional: Time of check-in/out if needed later, but for now just Present/Absent
}
