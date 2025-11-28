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

    [HttpPost]
    public async Task<ActionResult<Cliente>> Crear([FromBody] Cliente cliente)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var nuevoCliente = await _clienteService.CrearClienteAsync(cliente);
        return CreatedAtAction(nameof(ObtenerTodos), new { id = nuevoCliente.ClienteId }, nuevoCliente);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Cliente>> Actualizar(int id, [FromBody] Cliente cliente)
    {
        if (id != cliente.ClienteId)
        {
            return BadRequest("El ID del cliente no coincide.");
        }

        var clienteActualizado = await _clienteService.ActualizarClienteAsync(id, cliente);
        
        if (clienteActualizado == null)
        {
            return NotFound($"No se encontró el cliente con ID {id}.");
        }

        return Ok(clienteActualizado);
    }
}
