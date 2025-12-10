using Microsoft.AspNetCore.Mvc;
using SGA.Data;
using SGA.Models;
using SGA.Models.DTOs;
using SGA.Services;
using SGA.Helpers;

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
    public async Task<ActionResult<IEnumerable<UsuarioDTO>>> GetEmpleados()
    {
        var users = _context.Usuarios.ToList();
        var dtos = new List<UsuarioDTO>();

        var firstDayOfMonth = new DateTime(TimeHelper.Now.Year, TimeHelper.Now.Month, 1);
        var lastDayOfMonth = firstDayOfMonth.AddMonths(1).AddDays(-1);

        foreach (var u in users)
        {
            // Calculate sales for this month (Unit count of Eggs as per previous logic, or Total amount?)
            // The prompt says "vincule con ventas". Let's show Total Money for now as it's more generic, or quantity if specific.
            // But looking at GetEstadisticas, it calculates eggs.
            // Let's use simple query here for performance, or call Service if needed.
            // To be fast, we might want to do a GroupBy query outside loop, but for small number of employees loop is fine.

            var stats = await _empleadoService.GetEstadisticasAsync(u.UsuarioId, firstDayOfMonth, lastDayOfMonth);
            // Also need absences
            var faltas = await _empleadoService.GetFaltasPorEmpleadoAsync(u.UsuarioId, firstDayOfMonth, lastDayOfMonth);

            dtos.Add(new UsuarioDTO
            {
                UsuarioId = u.UsuarioId,
                Nombre = u.Nombre,
                Role = u.Rol.ToString(),
                Telefono = u.Telefono,
                FechaIngreso = u.FechaIngreso,
                Estado = u.Estado,
                DNI = u.DNI,
                VentasDelMes = stats.TotalHuevosVendidos, // Using Egg Count as "Ventas" metric based on previous context, or stats.TotalVentas?
                                                          // Let's use TotalHuevosVendidos as the prompt implies "Sales" usually means volume in this egg business.
                                                          // Actually, let's use TotalVentas (money) or check what frontend expects.
                                                          // Frontend says "Ventas (Huevos/Mes)". So it expects Quantity.
                FaltasDelMes = faltas.Count
            });
        }

        return Ok(dtos);
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
        var d = desde ?? new DateTime(TimeHelper.Now.Year, TimeHelper.Now.Month, 1);
        var h = hasta ?? TimeHelper.Now;

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

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteEmpleado(int id)
    {
        try
        {
            await _empleadoService.DeleteEmpleadoAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
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
