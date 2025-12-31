using Microsoft.AspNetCore.Mvc;
using SGA.Data;
using SGA.Models;
using SGA.Models.DTOs;
using SGA.Services;
using SGA.Helpers;

using Microsoft.AspNetCore.Authorization;

namespace SGA.Controllers;

[Authorize]
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
        try 
        {
            var users = await _context.Usuarios.AsNoTracking().ToListAsync();
            var dtos = new List<UsuarioDTO>();

            var firstDayOfMonth = new DateTime(TimeHelper.Now.Year, TimeHelper.Now.Month, 1);
            var lastDayOfMonth = firstDayOfMonth.AddMonths(1).AddDays(-1);

            // Bulk fetch sales for the current month for all users
            // We select only necessary fields to reduce data transfer if possible, 
            // but projecting to anonymous type first is good.
            // Using AsNoTracking for read-only speed.
            var allSales = await _context.Ventas
                .AsNoTracking()
                .Where(v => v.Fecha >= firstDayOfMonth && v.Fecha <= lastDayOfMonth)
                .Select(v => new { v.UsuarioId, v.Total, v.MetodoPago })
                .ToListAsync();

            // Bulk fetch absences
            var allFaltas = await _context.Faltas
                .AsNoTracking()
                .Where(f => f.Fecha >= firstDayOfMonth && f.Fecha <= lastDayOfMonth)
                .Select(f => new { f.UsuarioId })
                .ToListAsync();

            foreach (var u in users)
            {
                var userSales = allSales.Where(v => v.UsuarioId == u.UsuarioId).ToList();
                var userFaltasCount = allFaltas.Count(f => f.UsuarioId == u.UsuarioId);

                dtos.Add(new UsuarioDTO
                {
                    UsuarioId = u.UsuarioId,
                    Nombre = u.Nombre,
                    Role = u.Rol.ToString(),
                    Telefono = u.Telefono,
                    FechaIngreso = u.FechaIngreso,
                    Estado = u.Estado,
                    DNI = u.DNI,
                    VentasDelMes = userSales.Sum(v => v.Total),
                    FaltasDelMes = userFaltasCount,
                    TotalEfectivo = userSales.Where(v => v.MetodoPago == SGA.Models.Enums.MetodoPago.Efectivo).Sum(v => v.Total),
                    TotalMercadoPago = userSales.Where(v => v.MetodoPago == SGA.Models.Enums.MetodoPago.MercadoPago).Sum(v => v.Total),
                    TotalCuentaCorriente = userSales.Where(v => v.MetodoPago == SGA.Models.Enums.MetodoPago.CuentaCorriente).Sum(v => v.Total)
                });
            }

            return Ok(dtos);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error interno al obtener empleados", error = ex.Message });
        }
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
