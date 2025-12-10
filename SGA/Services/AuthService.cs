using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SGA.Data;
using SGA.Helpers;
using SGA.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SGA.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<string?> LoginAsync(string dni, string password)
    {
        var user = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.DNI == dni);

        if (user == null) return null;

        // Verify password
        if (!PasswordHelper.VerifyPassword(password, user.ContrasenaHash))
        {
            return null;
        }

        // Generate Token
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!);
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.UsuarioId.ToString()),
                new Claim(ClaimTypes.Name, user.Nombre),
                new Claim(ClaimTypes.Role, user.Rol.ToString())
            }),
            Expires = DateTime.UtcNow.AddDays(7),
            Issuer = _configuration["Jwt:Issuer"],
            Audience = _configuration["Jwt:Audience"],
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public async Task<Usuario> RegisterAsync(Usuario usuario)
    {
        usuario.ContrasenaHash = PasswordHelper.HashPassword(usuario.ContrasenaHash);
        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();
        return usuario;
    }
}
