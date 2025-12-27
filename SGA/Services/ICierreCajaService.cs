using SGA.Models;

namespace SGA.Services;

public interface ICierreCajaService
{
    Task<CierreCajaDiario> CalcularResumen(DateTime fecha);
    Task<CierreCajaDiario> CerrarCaja(CierreCajaDiario cierre, int usuarioId);
    Task<IEnumerable<CierreCajaDiario>> ObtenerHistorial();
    Task<bool> ExisteCierre(DateTime fecha);
}
