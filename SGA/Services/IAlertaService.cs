using SGA.Models;

namespace SGA.Services;

public interface IAlertaService
{
    Task<List<AlertaDTO>> ObtenerAlertasOperativasAsync();
}

public class AlertaDTO
{
    public int Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Mensaje { get; set; } = string.Empty;
    public string Tipo { get; set; } = "Info"; // "Info", "Warning", "Critical"
    public DateTime Fecha { get; set; }
    public string Icono { get; set; } = "Info"; // "Package", "Truck", "DollarSign", etc.
    public string? Url { get; set; }

}
