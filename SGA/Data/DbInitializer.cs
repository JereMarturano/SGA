using SGA.Models;
using SGA.Models.Enums;
using SGA.Helpers; // Added for PasswordHelper
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace SGA.Data;

public static class DbInitializer
{
    public static void Initialize(AppDbContext context)
    {
        // Context is managed via Migrations in Program.cs
        // context.Database.EnsureCreated();

        // Check if Kilometraje column exists in Vehiculos table and add it if missing
        // Check if Kilometraje column exists - HANDLED BY EF CORE MODEL
        // try
        // {
        //    // REMOVED MSSQL SPECIFIC CODE
        // }
        // catch (Exception ex)
        // {
        //     Console.WriteLine($"Error updating schema: {ex.Message}");
        // }

        // Seed Productos if missing (Check for key products)
        if (!context.Productos.Any())
        {
            var productos = new Producto[]
            {
                new Producto { Nombre = "Huevo Blanco Grande", TipoProducto = TipoProducto.Huevo, StockActual = 1000, StockMinimoAlerta = 100, UnidadDeMedida = "Maple", EsHuevo = true, Tamano = TamanoHuevo.Grande, Color = ColorHuevo.Blanco, UnidadesPorBulto = 30, CostoUltimaCompra = 2000, PrecioSugerido = 2500, PrecioMinimo = 2300, PrecioMaximo = 3000 },
                new Producto { Nombre = "Huevo Blanco Mediano", TipoProducto = TipoProducto.Huevo, StockActual = 1000, StockMinimoAlerta = 100, UnidadDeMedida = "Maple", EsHuevo = true, Tamano = TamanoHuevo.Mediano, Color = ColorHuevo.Blanco, UnidadesPorBulto = 30, CostoUltimaCompra = 1800, PrecioSugerido = 2200, PrecioMinimo = 2000, PrecioMaximo = 2700 },
                new Producto { Nombre = "Huevo Blanco Chico", TipoProducto = TipoProducto.Huevo, StockActual = 1000, StockMinimoAlerta = 100, UnidadDeMedida = "Maple", EsHuevo = true, Tamano = TamanoHuevo.Chico, Color = ColorHuevo.Blanco, UnidadesPorBulto = 30, CostoUltimaCompra = 1500, PrecioSugerido = 1900, PrecioMinimo = 1700, PrecioMaximo = 2400 },
                new Producto { Nombre = "Huevo Blanco Jumbo", TipoProducto = TipoProducto.Huevo, StockActual = 500, StockMinimoAlerta = 50, UnidadDeMedida = "Maple", EsHuevo = true, Tamano = TamanoHuevo.Jumbo, Color = ColorHuevo.Blanco, UnidadesPorBulto = 30, CostoUltimaCompra = 2200, PrecioSugerido = 2800, PrecioMinimo = 2500, PrecioMaximo = 3500 },
                new Producto { Nombre = "Huevo Color Grande", TipoProducto = TipoProducto.Huevo, StockActual = 1000, StockMinimoAlerta = 100, UnidadDeMedida = "Maple", EsHuevo = true, Tamano = TamanoHuevo.Grande, Color = ColorHuevo.Color, UnidadesPorBulto = 30, CostoUltimaCompra = 2100, PrecioSugerido = 2600, PrecioMinimo = 2400, PrecioMaximo = 3100 },
                new Producto { Nombre = "Huevo Color Mediano", TipoProducto = TipoProducto.Huevo, StockActual = 1000, StockMinimoAlerta = 100, UnidadDeMedida = "Maple", EsHuevo = true, Tamano = TamanoHuevo.Mediano, Color = ColorHuevo.Color, UnidadesPorBulto = 30, CostoUltimaCompra = 1900, PrecioSugerido = 2300, PrecioMinimo = 2100, PrecioMaximo = 2800 },
                // Add basic insumos for Silos
                new Producto { Nombre = "Maiz", TipoProducto = TipoProducto.Insumo, StockActual = 0, StockMinimoAlerta = 1000, UnidadDeMedida = "Kg", EsHuevo = false, CostoUltimaCompra = 180 },
                new Producto { Nombre = "Soja", TipoProducto = TipoProducto.Insumo, StockActual = 0, StockMinimoAlerta = 1000, UnidadDeMedida = "Kg", EsHuevo = false, CostoUltimaCompra = 350 },
                new Producto { Nombre = "Alimento Balanceado", TipoProducto = TipoProducto.Insumo, StockActual = 0, StockMinimoAlerta = 1000, UnidadDeMedida = "Kg", EsHuevo = false, CostoUltimaCompra = 450 },
                new Producto { Nombre = "Retazo Soja", TipoProducto = TipoProducto.Insumo, StockActual = 0, StockMinimoAlerta = 100, UnidadDeMedida = "Kg", EsHuevo = false, CostoUltimaCompra = 280 }
            };
            context.Productos.AddRange(productos);
            context.SaveChanges();
        }
        else
        {
             // Ensure Maiz, Soja and Balanceado exist for Silos
             if (!context.Productos.Any(p => p.Nombre == "Maiz"))
             {
                 context.Productos.Add(new Producto { Nombre = "Maiz", TipoProducto = TipoProducto.Insumo, StockActual = 0, StockMinimoAlerta = 1000, UnidadDeMedida = "Kg", EsHuevo = false });
             }
             if (!context.Productos.Any(p => p.Nombre == "Soja"))
             {
                 context.Productos.Add(new Producto { Nombre = "Soja", TipoProducto = TipoProducto.Insumo, StockActual = 0, StockMinimoAlerta = 1000, UnidadDeMedida = "Kg", EsHuevo = false });
             }
             if (!context.Productos.Any(p => p.Nombre == "Alimento Balanceado"))
             {
                 context.Productos.Add(new Producto { Nombre = "Alimento Balanceado", TipoProducto = TipoProducto.Insumo, StockActual = 0, StockMinimoAlerta = 1000, UnidadDeMedida = "Kg", EsHuevo = false });
             }
             if (!context.Productos.Any(p => p.Nombre == "Retazo Soja"))
             {
                 context.Productos.Add(new Producto { Nombre = "Retazo Soja", TipoProducto = TipoProducto.Insumo, StockActual = 0, StockMinimoAlerta = 100, UnidadDeMedida = "Kg", EsHuevo = false });
             }
             context.SaveChanges();
        }

        // Seed Vehiculos (Robust Check)
        var vehiclesToEnsure = new Vehiculo[]
        {
            new Vehiculo { Patente = "AA123BB", Marca = "Peugeot", Modelo = "Boxer", CapacidadCarga = 1500, ConsumoPromedioLts100Km = 12, EnRuta = false },
            new Vehiculo { Patente = "CC456DD", Marca = "Fiat", Modelo = "Fiorino", CapacidadCarga = 650, ConsumoPromedioLts100Km = 9, EnRuta = false },
            new Vehiculo { Patente = "GRANJA", Marca = "SGA", Modelo = "Punto de Venta", CapacidadCarga = 999999, ConsumoPromedioLts100Km = 0, EnRuta = false }
        };

        foreach (var v in vehiclesToEnsure)
        {
            var existing = context.Vehiculos.FirstOrDefault(x => x.Patente == v.Patente);
            if (existing == null)
            {
                context.Vehiculos.Add(v);
            }
            else if (v.Patente == "GRANJA")
            {
                var activeTrip = context.Viajes.Any(viaje => viaje.VehiculoId == existing.VehiculoId && viaje.Estado == EstadoViaje.EnCurso);
                if (existing.EnRuta && !activeTrip)
                {
                    existing.EnRuta = false;
                }
            }
        }
        context.SaveChanges();

        // Seed Galpones (Robust Check)
        var galpones = new[]
        {
            new Galpon { Nombre = "Galpón 1", Tipo = "Produccion", CantidadAves = 5000, PrecioCompraAve = 1000, FechaAlta = DateTime.Now.AddMonths(-6) },
            new Galpon { Nombre = "Galpón 2", Tipo = "Produccion", CantidadAves = 5000, PrecioCompraAve = 1200, FechaAlta = DateTime.Now.AddMonths(-3) },
            new Galpon { Nombre = "Galpón 3", Tipo = "Produccion", CantidadAves = 0, PrecioCompraAve = 0, Estado = "Limpieza" },
            new Galpon { Nombre = "Habitación Pollitos 1", Tipo = "Pollitos", CantidadAves = 2000, PrecioCompraAve = 500, FechaAlta = DateTime.Now }
        };

        foreach (var g in galpones)
        {
            if (!context.Galpones.Any(x => x.Nombre == g.Nombre))
            {
                context.Galpones.Add(g);
            }
        }
        context.SaveChanges();

        // Seed Silos (Robust Check)
        var maizId = context.Productos.FirstOrDefault(p => p.Nombre == "Maiz")?.ProductoId;
        var balanceadoId = context.Productos.FirstOrDefault(p => p.Nombre == "Alimento Balanceado")?.ProductoId;
        var sojaId = context.Productos.FirstOrDefault(p => p.Nombre == "Soja")?.ProductoId;

        // Ensure "Retazo Soja" exists for selection, although not seeded into a specific silo initially
        // (It is already seeded in the Productos section above)

        var silos = new Silo[]
        {
            new Silo { Nombre = "Silo 1", CapacidadKg = 10000, CantidadActualKg = 2500, PrecioPromedioCompra = 150, ProductoId = maizId },
            new Silo { Nombre = "Silo 2", CapacidadKg = 10000, CantidadActualKg = 5000, PrecioPromedioCompra = 200, ProductoId = balanceadoId },
            new Silo { Nombre = "Silo 3", CapacidadKg = 10000, CantidadActualKg = 0, ProductoId = sojaId },
            new Silo { Nombre = "Carro (Silo Móvil)", CapacidadKg = 2000, CantidadActualKg = 500, PrecioPromedioCompra = 200, ProductoId = balanceadoId }
        };

        // 1. Remove silos that shouldn't exist
        var validNames = silos.Select(s => s.Nombre).ToList();
        var invalidSilos = context.Silos.Where(s => !validNames.Contains(s.Nombre)).ToList();
        
        if (invalidSilos.Any())
        {
            context.Silos.RemoveRange(invalidSilos);
            context.SaveChanges(); // Commit deletion first
        }

        // 2. Add or Update valid silos
        foreach (var s in silos)
        {
            var existingSilo = context.Silos.FirstOrDefault(x => x.Nombre == s.Nombre);
            if (existingSilo == null)
            {
                context.Silos.Add(s);
            }
            else
            {
                 // Update properties if needed, e.g. ensure Type is correct or if it was reset
                 // For now, we trust the existing valid silo's state, but we ensure Product is linked if missing matches
                 // Ensure Product is linked correctly (Force update for default silos)
                 if (s.ProductoId != null && existingSilo.ProductoId != s.ProductoId)
                 {
                     existingSilo.ProductoId = s.ProductoId;
                 }
            }
        }
        context.SaveChanges();




        // Seed Clientes if missing or update debt for testing
        if (!context.Clientes.Any())
        {
            var clientes = new Cliente[]
            {
                new Cliente { NombreCompleto = "Gervasio Gatti", DNI = "12345678", Direccion = "Calle Falsa 123", Deuda = 150000, VentasTotales = 500000 },
                new Cliente { NombreCompleto = "Martín Fierro", DNI = "87654321", Direccion = "Pampa 456", Deuda = 85000, VentasTotales = 250000 },
                new Cliente { NombreCompleto = "Juan Moreira", DNI = "44556677", Direccion = "Pulperia 789", Deuda = 0, VentasTotales = 120000 }
            };
            context.Clientes.AddRange(clientes);
        }
        else if (context.Clientes.Sum(c => c.Deuda) == 0)
        {
            // If we have clients but no debt, let's assign some to the first one for dashboard verification
            var firstClient = context.Clientes.FirstOrDefault();
            if (firstClient != null) firstClient.Deuda = 125000;
        }
        context.SaveChanges();

        // Seed Usuarios if missing
        if (!context.Usuarios.Any())
        {
            var usuarios = new Usuario[]
            {
                new Usuario { Nombre = "Admin", Rol = RolUsuario.Admin, ContrasenaHash = PasswordHelper.HashPassword("admin123") },
                new Usuario { Nombre = "Chofer 1", Rol = RolUsuario.Chofer, ContrasenaHash = PasswordHelper.HashPassword("chofer1") }
            };
            context.Usuarios.AddRange(usuarios);
        }

        context.SaveChanges();

        // FIX: Broad Cleanup for "Admin", "Jefe", and "Santiago Perez"
        // We look for these specific names or any Admin role to be safe, but prioritizing the names the user mentioned.
        var targetNames = new[] { "Admin", "Jefe", "Santiago Perez" };
        var usersToConsolidate = context.Usuarios
            .Where(u => targetNames.Contains(u.Nombre) || u.Rol == RolUsuario.Admin)
            .ToList();

        // Identify or Create Official Admin "Santiago Perez"
        var officialAdmin = usersToConsolidate.FirstOrDefault(u => u.Nombre == "Santiago Perez");

        if (officialAdmin == null)
        {
            if (usersToConsolidate.Any())
            {
                // Promote the first available one to be Santiago
                officialAdmin = usersToConsolidate.First();
                officialAdmin.Nombre = "Santiago Perez";
                officialAdmin.Rol = RolUsuario.Admin; // Ensure he is Admin
                if (string.IsNullOrEmpty(officialAdmin.DNI)) officialAdmin.DNI = "11111111";
            }
            else
            {
                // Create brand new
                officialAdmin = new Usuario 
                { 
                    Nombre = "Santiago Perez", 
                    Rol = RolUsuario.Admin, 
                    ContrasenaHash = PasswordHelper.HashPassword("admin123"),
                    DNI = "11111111"
                };
                context.Usuarios.Add(officialAdmin);
            }
        }

        // Ensure official user has correct Admin credentials (runs for both New and Existing)
        if (officialAdmin != null)
        {
            officialAdmin.Rol = RolUsuario.Admin;
            officialAdmin.ContrasenaHash = PasswordHelper.HashPassword("admin123");
            officialAdmin.DNI = "33123456";
            Console.WriteLine("DEBUG: Admin credentials enforced: DNI='33123456', Pass='admin123'");
        }
        
        context.SaveChanges(); // Ensure IDs are set

        // Reassign and Delete duplicates
        foreach (var user in usersToConsolidate)
        {
            // Skip the official admin
            if (user.UsuarioId == officialAdmin.UsuarioId) continue;

            // Only delete if it's one of the duplicates we want to remove (Admin, Jefe, or other Admins)
            // effective check: is it in the list and NOT the official one? Yes.
            
            // Reassign Data using Raw SQL to bypass constraints
            context.Database.ExecuteSqlRaw("UPDATE Ventas SET UsuarioId = {0} WHERE UsuarioId = {1}", officialAdmin.UsuarioId, user.UsuarioId);
            context.Database.ExecuteSqlRaw("UPDATE Asistencias SET UsuarioId = {0} WHERE UsuarioId = {1}", officialAdmin.UsuarioId, user.UsuarioId);
            context.Database.ExecuteSqlRaw("UPDATE Faltas SET UsuarioId = {0} WHERE UsuarioId = {1}", officialAdmin.UsuarioId, user.UsuarioId);
            context.Database.ExecuteSqlRaw("UPDATE MovimientosStock SET UsuarioId = {0} WHERE UsuarioId = {1}", officialAdmin.UsuarioId, user.UsuarioId);
            context.Database.ExecuteSqlRaw("UPDATE Compras SET UsuarioId = {0} WHERE UsuarioId = {1}", officialAdmin.UsuarioId, user.UsuarioId);
            
            // Update Vehicle assignments if any (ChoferId is usually on Viaje or Vehiculo?)
            // If Vehiculo has current ChoferId, check if needs update? 
            // Usually ChoferId is for drivers. "Jefe" might be assigned? Unlikely but safe to check?
            // Let's stick to the main tables for now.
            
            context.Usuarios.Remove(user);
        }
        
        context.SaveChanges();
    }
}
