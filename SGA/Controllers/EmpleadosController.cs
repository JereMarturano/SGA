using Microsoft.AspNetCore.Mvc;
using SGA.Data;
using SGA.Models;
using SGA.Models.DTOs;
using SGA.Services;

namespace SGA.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmpleadosController : ControllerBase
{
    private readonly IEmpleadoService _empleadoService;
    private readonly AppDbContext _context; // For getting list of employees if needed directly

    public EmpleadosController(IEmpleadoService empleadoService, AppDbContext context)
    {
        _empleadoService = empleadoService;
        _context = context;
    }

    // GET: api/empleados
    [HttpGet]
    public ActionResult<IEnumerable<Usuario>> GetEmpleados()
    {
        // Return only users with roles that are considered employees (e.g., Chofer, Vendedor)
        // Or all users for now.
        return _context.Usuarios.ToList();
    }

    [HttpPost]
    public async Task<ActionResult<Usuario>> CreateEmpleado([FromBody] CreateEmpleadoDto dto)
    {
        try
        {
            var empleado = await _empleadoService.CreateEmpleadoAsync(dto);
            return CreatedAtAction(nameof(GetEmpleados), new { id = empleado.UsuarioId }, empleado);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error interno", error = ex.Message });
        }
    }

    // POST: api/empleados/{id}/faltas
    [HttpPost("{id}/faltas")]
    public async Task<ActionResult<Falta>> RegistrarFalta(int id, [FromBody] RegistrarFaltaDto dto)
    {
        try
        {
            var falta = await _empleadoService.RegistrarFaltaAsync(id, dto.Fecha, dto.Motivo, dto.EsJustificada);
            return CreatedAtAction(nameof(GetFaltas), new { id = id }, falta);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, "Error interno: " + ex.Message);
        }
    }

    // GET: api/empleados/{id}/faltas
    [HttpGet("{id}/faltas")]
    public async Task<ActionResult<IEnumerable<Falta>>> GetFaltas(int id, [FromQuery] DateTime? desde, [FromQuery] DateTime? hasta)
    {
        var faltas = await _empleadoService.GetFaltasPorEmpleadoAsync(id, desde, hasta);
        return Ok(faltas);
    }

    // GET: api/empleados/{id}/estadisticas
    [HttpGet("{id}/estadisticas")]
    public async Task<ActionResult<EmpleadoEstadisticasDto>> GetEstadisticas(int id, [FromQuery] DateTime? desde, [FromQuery] DateTime? hasta)
    {
        // Default to this month if not specified
        var d = desde ?? new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1);
        var h = hasta ?? DateTime.Now;

        try
        {
            var stats = await _empleadoService.GetEstadisticasAsync(id, d, h);
            return Ok(stats);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateEmpleado(int id, [FromBody] UpdateEmpleadoDTO dto)
    {
        try
        {
            await _empleadoService.UpdateEmpleadoAsync(id, dto);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error interno", error = ex.Message });
        }
    }
}

public class RegistrarFaltaDto
{
    public DateTime Fecha { get; set; }
    public string Motivo { get; set; } = string.Empty;
    public bool EsJustificada { get; set; }
}
