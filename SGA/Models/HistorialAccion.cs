using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SGA.Helpers;

namespace SGA.Models;

public class HistorialAccion
{
    [Key]
    public int HistorialAccionId { get; set; }

    [Required]
    public string Accion { get; set; } = string.Empty; // Ej: "Registrar Venta", "Actualizar Stock"

    public string? Entidad { get; set; } // Ej: "Venta", "Producto"

    public string? EntidadId { get; set; } // ID del objeto afectado

    public DateTime Fecha { get; set; } = TimeHelper.Now;

    public int? UsuarioId { get; set; } // Quién lo hizo

    [ForeignKey("UsuarioId")]
    public Usuario? Usuario { get; set; }

    public string? Detalles { get; set; } // JSON o texto con detalles del cambio
}
