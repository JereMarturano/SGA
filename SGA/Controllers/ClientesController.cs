using Microsoft.AspNetCore.Mvc;
using SGA.Models;
using SGA.Services;

namespace SGA.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClientesController : ControllerBase
{
    private readonly IClienteService _clienteService;

    public ClientesController(IClienteService clienteService)
    {
        _clienteService = clienteService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Cliente>>> ObtenerTodos()
    {
        var clientes = await _clienteService.ObtenerTodosLosClientesAsync();
        return Ok(clientes);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Cliente>> ObtenerPorId(int id)
    {
        var cliente = await _clienteService.ObtenerClientePorIdAsync(id);

        if (cliente == null)
        {
            return NotFound($"No se encontró el cliente con ID {id}.");
        }

        return Ok(cliente);
    }

    [HttpPost]
    public async Task<ActionResult<Cliente>> Crear([FromBody] Cliente cliente)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var nuevoCliente = await _clienteService.CrearClienteAsync(cliente);
            return CreatedAtAction(nameof(ObtenerTodos), new { id = nuevoCliente.ClienteId }, nuevoCliente);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Cliente>> Actualizar(int id, [FromBody] Cliente cliente)
    {
        if (id != cliente.ClienteId)
        {
            return BadRequest("El ID del cliente no coincide.");
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var clienteActualizado = await _clienteService.ActualizarClienteAsync(id, cliente);

            if (clienteActualizado == null)
            {
                return NotFound($"No se encontró el cliente con ID {id}.");
            }

            return Ok(clienteActualizado);
        }
        catch (InvalidOperationException ex)
        {
             return Conflict(new { mensaje = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var eliminado = await _clienteService.EliminarClienteAsync(id);
        
        if (!eliminado)
        {
            return NotFound($"No se encontró el cliente con ID {id}.");
        }

        return NoContent();
    }
}
