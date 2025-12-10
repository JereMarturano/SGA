using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SGA.Services;

namespace SGA.Controllers;

[ApiController]
[Route("api/admin/safety")]
[Authorize(Roles = "Admin")]
public class AdminSafetyController : ControllerBase
{
    private readonly IRestorationService _restorationService;

    public AdminSafetyController(IRestorationService restorationService)
    {
        _restorationService = restorationService;
    }

    [HttpPost("revertir-usuario/{id}")]
    public async Task<IActionResult> RevertirUsuario(int id, [FromBody] RevertirDto dto)
    {
        try
        {
            await _restorationService.RevertirAccionesUsuarioAsync(id, dto.Desde, dto.Motivo);
            return Ok(new { message = "Acciones revertidas exitosamente." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }
}

public class RevertirDto
{
    public DateTime? Desde { get; set; }
    public string Motivo { get; set; } = string.Empty;
}
