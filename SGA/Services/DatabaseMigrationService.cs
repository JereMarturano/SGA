using Microsoft.EntityFrameworkCore;
using SGA.Data;
using SGA.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;

namespace SGA.Services;

public class DatabaseMigrationService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<DatabaseMigrationService> _logger;

    public DatabaseMigrationService(IConfiguration configuration, ILogger<DatabaseMigrationService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    private void Log(string message)
    {
        try 
        { 
            // Write to a dedicated migration log file
            File.AppendAllText("migration_job.log", $"{DateTime.Now}: {message}\n"); 
        } 
        catch { }
        Console.WriteLine(message);
    }

    public async Task MigrateAsync()
    {
        Log("==============================================");
        Log("=== STARTED MIGRATION SERVICE EXECUTION ===");
        Log("==============================================");
        
        // 1. Setup Source (MSSQL)
        // Accessing MSSQL Container from Host (dotnet run)
        var sqlConnectionString = "Server=127.0.0.1,1433;Database=SGA_Avicola;User Id=sa;Password=Password123!;TrustServerCertificate=True;Encrypt=False;Connection Timeout=30;";
        
        Log($"[CONFIG] Source MSSQL Connection: {sqlConnectionString}");

        var sourceOptions = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer(sqlConnectionString)
            .Options;

        // 2. Setup Destination (PostgreSQL)
        // Accessing Postgres Container from Host (dotnet run)
        var pgConnectionString = "Server=127.0.0.1;Port=5432;Database=SGA_Avicola;User Id=postgres;Password=postgres;Include Error Detail=true";
        
        Log($"[CONFIG] Dest Postgres Connection: {pgConnectionString}");

        var destOptions = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(pgConnectionString)
            .Options;

        using var sourceContext = new AppDbContext(sourceOptions);
        using var destContext = new AppDbContext(destOptions);

        Log("[STEP 1] Testing Source Connection...");
        try 
        {
            if (!await sourceContext.Database.CanConnectAsync())
            {
                Log("[ERROR] Cannot connect to Source (MSSQL) database! Check if container is running and port 1433 is mapped.");
                return;
            }
        }
        catch(Exception ex)
        {
            Log($"[EXCEPTION] Connecting to Source: {ex.Message}");
            return;
        }
        var clientsCount = await sourceContext.Clientes.CountAsync();
        Log($"[SUCCESS] Connected to Source MSSQL. Found {clientsCount} clients to migrate.");

        Log("[STEP 2] Preparing Destination Database...");
        try
        {
             // WIPE AND RECREATE
             bool deleted = await destContext.Database.EnsureDeletedAsync();
             Log(deleted ? "Existing Postgres DB deleted." : "No existing Postgres DB found.");
             
             await destContext.Database.EnsureCreatedAsync();
             Log("New Postgres Schema Created.");
        }
        catch(Exception ex)
        {
             Log($"[ERROR] Failed to create destination DB: {ex.Message}");
             throw;
        }

        // 3. Disable Constraints for Bulk Insert
        await destContext.Database.ExecuteSqlRawAsync("SET session_replication_role = 'replica';");

        using var transaction = await destContext.Database.BeginTransactionAsync();

        try 
        {
            // 4. Migrate Tables
            Log("Starting Migrating Tables...");
            
            await CopyDataAsync(sourceContext.Usuarios, destContext.Usuarios, "Usuarios");
            await CopyDataAsync(sourceContext.Clientes, destContext.Clientes, "Clientes");
            await CopyDataAsync(sourceContext.Vehiculos, destContext.Vehiculos, "Vehiculos");
            await CopyDataAsync(sourceContext.Productos, destContext.Productos, "Productos");
            await CopyDataAsync(sourceContext.Galpones, destContext.Galpones, "Galpones");
            await CopyDataAsync(sourceContext.Silos, destContext.Silos, "Silos");
            await CopyDataAsync(sourceContext.Ubicaciones, destContext.Ubicaciones, "Ubicaciones");
            
            // Dependent
            await CopyDataAsync(sourceContext.AlertasIgnoradas, destContext.AlertasIgnoradas, "AlertasIgnoradas");
            await CopyDataAsync(sourceContext.GastosVehiculos, destContext.GastosVehiculos, "GastosVehiculos");
            await CopyDataAsync(sourceContext.StockVehiculos, destContext.StockVehiculos, "StockVehiculos");
            await CopyDataAsync(sourceContext.MovimientosStock, destContext.MovimientosStock, "MovimientosStock");
            await CopyDataAsync(sourceContext.Viajes, destContext.Viajes, "Viajes");
            await CopyDataAsync(sourceContext.Ventas, destContext.Ventas, "Ventas");
            await CopyDataAsync(sourceContext.DetallesVenta, destContext.DetallesVenta, "DetallesVenta");
            
            await CopyDataAsync(sourceContext.Notificaciones, destContext.Notificaciones, "Notificaciones");
            await CopyDataAsync(sourceContext.HistorialAcciones, destContext.HistorialAcciones, "HistorialAcciones");
            await CopyDataAsync(sourceContext.Compras, destContext.Compras, "Compras");
            await CopyDataAsync(sourceContext.DetallesCompra, destContext.DetallesCompra, "DetallesCompra");
            await CopyDataAsync(sourceContext.Faltas, destContext.Faltas, "Faltas");
            await CopyDataAsync(sourceContext.Asistencias, destContext.Asistencias, "Asistencias");
            await CopyDataAsync(sourceContext.Pagos, destContext.Pagos, "Pagos");
            await CopyDataAsync(sourceContext.EventosGalpon, destContext.EventosGalpon, "EventosGalpon");
            await CopyDataAsync(sourceContext.Producciones, destContext.Producciones, "Producciones");
            await CopyDataAsync(sourceContext.ProduccionIngredientes, destContext.ProduccionIngredientes, "ProduccionIngredientes");
            await CopyDataAsync(sourceContext.CierresCajaDiarios, destContext.CierresCajaDiarios, "CierresCajaDiarios");
            await CopyDataAsync(sourceContext.Pedidos, destContext.Pedidos, "Pedidos");
            await CopyDataAsync(sourceContext.DetallesPedido, destContext.DetallesPedido, "DetallesPedido");
            
            await CopyDataAsync(sourceContext.LotesAves, destContext.LotesAves, "LotesAves");
            await CopyDataAsync(sourceContext.EventosMortalidad, destContext.EventosMortalidad, "EventosMortalidad");
            await CopyDataAsync(sourceContext.ItemsInventario, destContext.ItemsInventario, "ItemsInventario");
            await CopyDataAsync(sourceContext.ContenidosSilos, destContext.ContenidosSilos, "ContenidosSilos");

            // Save all changes
            Log("Saving changes to Postgres...");
            await destContext.SaveChangesAsync();
            await transaction.CommitAsync();
            Log("MIGRATION SUCCESSFUL.");
        }
        catch (Exception ex)
        {
            Log($"MIGRATION ERROR: {ex.Message}");
            Log($"{ex.StackTrace}");
            await transaction.RollbackAsync();
            throw;
        }
        finally
        {
            // Re-enable constraints
            await destContext.Database.ExecuteSqlRawAsync("SET session_replication_role = 'origin';");
            
            // Fix sequences
            await ResetSequences(destContext);
        }
    }

    private async Task CopyDataAsync<T>(DbSet<T> sourceSet, DbSet<T> destSet, string name) where T : class
    {
        Log($"Migrating table: {name}...");
        var data = await sourceSet.AsNoTracking().ToListAsync();
        if (data.Any())
        {
            // For Identity Insert to work in EF Core on Postgres, usually we just add them.
            // Since we disabled constraints, it should accept the IDs.
            await destSet.AddRangeAsync(data);
            Log($"Migrated {data.Count} records for {name}.");
        }
    }

    private async Task ResetSequences(AppDbContext context)
    {
        _logger.LogInformation("Resetting Sequences...");
        // This query finds all sequences and sets them to the max value of their table column
        // Standard Postgres Hack for EF Core logic
        
        var query = @"
DO $$
DECLARE
    row record;
BEGIN
    FOR row IN 
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE column_default LIKE 'nextval%' 
        AND table_schema = 'public'
    LOOP
        EXECUTE 'SELECT setval(''' || pg_get_serial_sequence('""' || row.table_name || '""', row.column_name) || ''', COALESCE((SELECT MAX(""' || row.column_name || '"") FROM ""' || row.table_name || '""'), 1));';
    END LOOP;
END$$;
";
        await context.Database.ExecuteSqlRawAsync(query);
    }
}
