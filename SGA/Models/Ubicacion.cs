using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGA.Models;

public class Ubicacion
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    // Optional: Type to distinguish behavior if needed in frontend/backend logic
    [MaxLength(50)]
    public string Tipo { get; set; } = "General"; // Galpon, Deposito, Taller, Silo
}
