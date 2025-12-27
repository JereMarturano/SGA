using SGA.Models;

namespace SGA.Services;

public interface IRestorationService
{
    Task RevertirAccionesUsuarioAsync(int usuarioId, DateTime? desde, string motivo);
    Task HardResetAsync();
}
