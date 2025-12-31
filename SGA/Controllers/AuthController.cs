using Microsoft.AspNetCore.Mvc;
using SGA.Models;
using SGA.Models.DTOs;
using SGA.Services;

using Microsoft.AspNetCore.Authorization;

namespace SGA.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpGet("debug-reset")]
    public async Task<IActionResult> DebugReset()
    {
        // EMERGENCY TOOL: Force reset admin credentials
        // This bypasses AuthService to interact with DB directly for diagnosis
        var context = HttpContext.RequestServices.GetRequiredService<SGA.Data.AppDbContext>();
        
        var admin = context.Usuarios.FirstOrDefault(u => u.DNI == "33123456");
        if (admin == null)
        {
            admin = new Usuario 
            { 
                Nombre = "Santiago Perez", 
                DNI = "33123456",
                Rol = Models.Enums.RolUsuario.Admin,
                Estado = "Activo",
                FechaIngreso = DateTime.UtcNow
            };
            context.Usuarios.Add(admin);
        }
        
        // Force Password
        admin.ContrasenaHash = SGA.Helpers.PasswordHelper.HashPassword("admin123");
        admin.Nombre = "Santiago Perez"; // Ensure name is correct
        
        await context.SaveChangesAsync();
        
        return Ok(new { message = "Admin Reset Successfully", dni = admin.DNI, hashPrefix = admin.ContrasenaHash.Substring(0, 10) + "..." });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        try 
        {
            var token = await _authService.LoginAsync(dto.DNI, dto.Password);
            if (token == null)
            {
                return Unauthorized("Credenciales inválidas. Verifique DNI y Contraseña.");
            }
            return Ok(new { token });
        }
        catch (Exception ex)
        {
            // Return plain text message so frontend doesn't crash trying to render an object
            return StatusCode(500, $"Error Interno: {ex.Message}");
        }
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] Usuario usuario)
    {
        // Esto debería estar protegido o ser solo inicial
        try
        {
             var created = await _authService.RegisterAsync(usuario);
             return Ok(created);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}

public class LoginDto
{
    public string DNI { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
