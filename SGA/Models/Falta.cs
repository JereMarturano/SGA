using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGA.Models;

public class Falta
{
    [Key]
    public int FaltaId { get; set; }

    [Required]
    public int UsuarioId { get; set; }
    [ForeignKey("UsuarioId")]
    public Usuario? Usuario { get; set; }

    [Required]
    public DateTime Fecha { get; set; }

    [MaxLength(200)]
    public string Motivo { get; set; } = string.Empty;

    public bool EsJustificada { get; set; }
}
