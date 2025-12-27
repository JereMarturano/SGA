using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGA.Models;

public class CierreCajaDiario
{
    [Key]
    public int CierreId { get; set; }

    public DateTime Fecha { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalVentas { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalGastos { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalHuevosVendidos { get; set; } // Cantidad de unidades/maples

    [Column(TypeName = "decimal(18,2)")]
    public decimal SaldoNeto { get; set; }

    public int UsuarioId { get; set; }
    [ForeignKey("UsuarioId")]
    public Usuario? Usuario { get; set; }

    public DateTime FechaCierre { get; set; } = DateTime.Now;

    public string? Observaciones { get; set; }
}
