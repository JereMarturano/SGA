using Microsoft.EntityFrameworkCore;
using SGA.Models;

namespace SGA.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Cliente> Clientes { get; set; }
    public DbSet<Producto> Productos { get; set; }
    public DbSet<Vehiculo> Vehiculos { get; set; }
    public DbSet<Usuario> Usuarios { get; set; }
    public DbSet<GastoVehiculo> GastosVehiculos { get; set; }
    public DbSet<StockVehiculo> StockVehiculos { get; set; }
    public DbSet<MovimientoStock> MovimientosStock { get; set; }
    public DbSet<Venta> Ventas { get; set; }
    public DbSet<DetalleVenta> DetallesVenta { get; set; }
    public DbSet<Notificacion> Notificaciones { get; set; }
    public DbSet<HistorialAccion> HistorialAcciones { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Unique constraints
        modelBuilder.Entity<Cliente>()
            .HasIndex(c => c.DNI)
            .IsUnique();

        modelBuilder.Entity<Vehiculo>()
            .HasIndex(v => v.Patente)
            .IsUnique();
            
        // Additional configuration if needed
    }
}
