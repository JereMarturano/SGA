using Microsoft.AspNetCore.Mvc;
using SGA.Models;
using SGA.Models.DTOs;
using SGA.Services;

using Microsoft.AspNetCore.Authorization;

namespace SGA.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class VehiculosController : ControllerBase
{
    private readonly IVehiculoService _vehiculoService;

    public VehiculosController(IVehiculoService vehiculoService)
    {
        _vehiculoService = vehiculoService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Vehiculo>>> GetVehiculos()
    {
        var vehiculos = await _vehiculoService.GetAllAsync();
        return Ok(vehiculos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Vehiculo>> GetVehiculo(int id)
    {
        var vehiculo = await _vehiculoService.GetByIdAsync(id);
        if (vehiculo == null)
        {
            return NotFound();
        }
        return Ok(vehiculo);
    }

    [HttpPost]
    public async Task<ActionResult<Vehiculo>> CreateVehiculo(CreateVehiculoDto dto)
    {
        try
        {
            var vehiculo = await _vehiculoService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetVehiculo), new { id = vehiculo.VehiculoId }, vehiculo);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateVehiculo(int id, UpdateVehiculoDto dto)
    {
        try
        {
            var vehiculo = await _vehiculoService.UpdateAsync(id, dto);
            if (vehiculo == null)
            {
                return NotFound();
            }
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteVehiculo(int id)
    {
        try
        {
            var result = await _vehiculoService.DeleteAsync(id);
            if (!result)
            {
                return NotFound();
            }
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("stock-en-calle")]
    public async Task<ActionResult<IEnumerable<object>>> GetStockEnCalle()
    {
        var result = await _vehiculoService.GetStockEnCalleAsync();
        return Ok(result);
    }
}
