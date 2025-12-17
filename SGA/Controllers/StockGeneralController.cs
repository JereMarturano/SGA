using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SGA.Models;
using SGA.Models.Enums;
using SGA.Services;
using System.Security.Claims;

namespace SGA.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class StockGeneralController : ControllerBase
{
    private readonly IStockGeneralService _stockService;

    public StockGeneralController(IStockGeneralService stockService)
    {
        _stockService = stockService;
    }

    // --- UBICACIONES ---
    [HttpGet("ubicaciones")]
    public async Task<IActionResult> GetUbicaciones()
    {
        await _stockService.EnsureLocationsExistAsync(); // Make sure they exist on first load
        return Ok(await _stockService.GetUbicacionesAsync());
    }

    // --- GALPONES / POLLITOS (LOTES) ---

    [HttpGet("lote-activo/{ubicacionId}")]
    public async Task<IActionResult> GetActiveLote(int ubicacionId)
    {
        var lote = await _stockService.GetActiveLoteAsync(ubicacionId);
        if (lote == null) return NoContent();
        return Ok(lote);
    }

    [HttpGet("historial-lotes/{ubicacionId}")]
    public async Task<IActionResult> GetLoteHistory(int ubicacionId)
    {
        return Ok(await _stockService.GetLoteHistoryAsync(ubicacionId));
    }

    // Only Jefe (Admin) can create/edit batches
    [HttpPost("lote")]
    public async Task<IActionResult> CreateLote([FromBody] LoteAve lote)
    {
        if (!IsAdmin()) return Forbid();
        try
        {
            var created = await _stockService.CreateLoteAsync(lote);
            return Ok(created);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("lote")]
    public async Task<IActionResult> UpdateLote([FromBody] LoteAve lote)
    {
        if (!IsAdmin()) return Forbid(); // "Solo el jefe puede modificar la cantidad de gallinas" (implies manual edit)
        try
        {
            var updated = await _stockService.UpdateLoteAsync(lote);
            return Ok(updated);
        }
        catch (Exception ex)
        {
             return BadRequest(ex.Message);
        }
    }

    // Anyone can register mortality (or maybe restricted, but usually workers do this. User said "marcar cuadno una gallina fallece", didn't strictly say only boss. He said "solo el jefe puede modificar la cantidad de gallinas... marcar cuando fallece". The "modify quantity" might refer to the base stock or purchasing. "Marcar fallece" is an event. I'll allow workers to register death, but maybe verify who did it.)
    [HttpPost("mortalidad")]
    public async Task<IActionResult> RegisterMortalidad([FromBody] EventoMortalidad evento)
    {
        try
        {
            // Assuming we have User ID in claims (standard in JWT)
            // If not, we might need to pass it or mock it.
            // Using a default ID 1 for now if claim missing, similar to other parts of system mentioned in Memory
            int userId = 1;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int parsedId))
            {
                userId = parsedId;
            }

            var result = await _stockService.RegisterMortalidadAsync(evento, userId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    // --- INVENTARIO (DEPOSITO / TALLER) ---
    [HttpGet("inventario/{ubicacionId}")]
    public async Task<IActionResult> GetInventario(int ubicacionId)
    {
        return Ok(await _stockService.GetItemsByUbicacionAsync(ubicacionId));
    }

    [HttpPost("inventario")]
    public async Task<IActionResult> SaveItem([FromBody] ItemInventario item)
    {
        // Maybe restrict to Admin or Encargado? Let's restrict to Admin for now based on strictness.
        // Actually, "jefe... hace el alimento". "jefe puede modificar...".
        // Let's assume Admin only for stock adjustments to be safe.
        if (!IsAdmin()) return Forbid();

        var result = await _stockService.CreateOrUpdateItemAsync(item);
        return Ok(result);
    }

    [HttpDelete("inventario/{id}")]
    public async Task<IActionResult> DeleteItem(int id)
    {
        if (!IsAdmin()) return Forbid();
        var result = await _stockService.DeleteItemAsync(id);
        if (!result) return NotFound();
        return Ok();
    }

    // --- SILOS ---
    [HttpGet("silos")]
    public async Task<IActionResult> GetSilos()
    {
        return Ok(await _stockService.GetSilosAsync());
    }

    [HttpGet("silo-contenido/{siloId}")]
    public async Task<IActionResult> GetSiloContents(int siloId)
    {
        return Ok(await _stockService.GetSiloContentsAsync(siloId));
    }

    [HttpPost("silo-contenido")]
    public async Task<IActionResult> UpdateSiloContent([FromBody] ContenidoSilo contenido)
    {
        if (!IsAdmin()) return Forbid();
        var result = await _stockService.UpdateSiloContentAsync(contenido);
        return Ok(result);
    }

    private bool IsAdmin()
    {
        // Check role claim.
        // Based on memory: "RolUsuario enum which includes: Admin..."
        // Typically stored in ClaimTypes.Role
        return User.IsInRole(nameof(RolUsuario.Admin));
    }
}
