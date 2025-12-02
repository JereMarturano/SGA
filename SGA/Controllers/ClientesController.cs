using Microsoft.AspNetCore.Mvc;
using SGA.Models;
using SGA.Models.DTOs;
using SGA.Models.Enums;
using SGA.Services;

namespace SGA.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClientesController : ControllerBase
{
    private readonly IClienteService _clienteService;
    private readonly IVentaService _ventaService;

    public ClientesController(IClienteService clienteService, IVentaService ventaService)
    {
        _clienteService = clienteService;
        _ventaService = ventaService;
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

    [HttpPost("{id}/pagos")]
    public async Task<ActionResult> RegistrarPago(int id, [FromBody] PagoDTO pagoDto)
    {
        try
        {
            var pago = await _clienteService.RegistrarPagoAsync(id, pagoDto.Monto, pagoDto.MetodoPago, pagoDto.Observacion);
            return Ok(pago);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{id}/ajuste-deuda")]
    public async Task<ActionResult> AjustarDeuda(int id, [FromBody] DeudaAjusteDTO ajusteDto)
    {
        var cliente = await _clienteService.AjustarDeudaAsync(id, ajusteDto.Monto, ajusteDto.EsAumento, ajusteDto.Motivo);

        if (cliente == null)
        {
            return NotFound("Cliente no encontrado.");
        }

        return Ok(cliente);
    }

    [HttpGet("{id}/historial-pagos")]
    public async Task<ActionResult<List<HistorialPagoDTO>>> ObtenerHistorialPagos(int id)
    {
        var pagos = await _clienteService.ObtenerHistorialPagosAsync(id);
        return Ok(pagos);
    }

    [HttpGet("{id}/historial-ventas")]
    public async Task<ActionResult<List<HistorialVentaDTO>>> ObtenerHistorialVentas(int id)
    {
        var ventas = await _ventaService.ObtenerVentasPorClienteAsync(id);
        return Ok(ventas);
    }
}
