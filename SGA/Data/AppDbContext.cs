using Microsoft.EntityFrameworkCore;
using SGA.Models;

namespace SGA.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Cliente> Clientes { get; set; }
    public DbSet<AlertaIgnorada> AlertasIgnoradas { get; set; }
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
    public DbSet<Compra> Compras { get; set; }
    public DbSet<DetalleCompra> DetallesCompra { get; set; }
    public DbSet<Falta> Faltas { get; set; }
    public DbSet<Asistencia> Asistencias { get; set; }
    public DbSet<Pago> Pagos { get; set; }
    public DbSet<Viaje> Viajes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Unique constraints
        modelBuilder.Entity<Cliente>()
            .HasIndex(c => c.DNI)
            .IsUnique()
            .HasFilter("[DNI] IS NOT NULL");

        modelBuilder.Entity<Vehiculo>()
            .HasIndex(v => v.Patente)
            .IsUnique();

        modelBuilder.Entity<Usuario>()
            .HasIndex(u => u.DNI)
            .IsUnique();
            
        // Additional configuration if needed
    }
}
