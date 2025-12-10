using SGA.Models;
using SGA.Models.DTOs; // Assuming LoginDto will be here or separate

namespace SGA.Services;

public interface IAuthService
{
    Task<string?> LoginAsync(string dni, string password);
    Task<Usuario> RegisterAsync(Usuario usuario);
}
