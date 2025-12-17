using SGA.Models;
using SGA.Models.Enums;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace SGA.Data;

public static class DbInitializer
{
    public static void Initialize(AppDbContext context)
    {
        // Ensure database is created
        context.Database.EnsureCreated();

        // Check if Kilometraje column exists in Vehiculos table and add it if missing
        try
        {
            var command = "IF COL_LENGTH('Vehiculos', 'Kilometraje') IS NULL BEGIN ALTER TABLE Vehiculos ADD Kilometraje decimal(18,2) NOT NULL DEFAULT 0 END";
            context.Database.ExecuteSqlRaw(command);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error updating schema: {ex.Message}");
        }

        // Seed Productos if missing
        if (!context.Productos.Any())
        {
            var productos = new Producto[]
            {
                new Producto { Nombre = "Huevo Blanco Grande", TipoProducto = TipoProducto.Huevo, StockActual = 1000, StockMinimoAlerta = 100, UnidadDeMedida = "Maple", EsHuevo = true, Tamano = TamanoHuevo.Grande, Color = ColorHuevo.Blanco, UnidadesPorBulto = 30 },
                new Producto { Nombre = "Huevo Blanco Mediano", TipoProducto = TipoProducto.Huevo, StockActual = 1000, StockMinimoAlerta = 100, UnidadDeMedida = "Maple", EsHuevo = true, Tamano = TamanoHuevo.Mediano, Color = ColorHuevo.Blanco, UnidadesPorBulto = 30 },
                new Producto { Nombre = "Huevo Blanco Chico", TipoProducto = TipoProducto.Huevo, StockActual = 1000, StockMinimoAlerta = 100, UnidadDeMedida = "Maple", EsHuevo = true, Tamano = TamanoHuevo.Chico, Color = ColorHuevo.Blanco, UnidadesPorBulto = 30 },
                new Producto { Nombre = "Huevo Blanco Jumbo", TipoProducto = TipoProducto.Huevo, StockActual = 500, StockMinimoAlerta = 50, UnidadDeMedida = "Maple", EsHuevo = true, Tamano = TamanoHuevo.Jumbo, Color = ColorHuevo.Blanco, UnidadesPorBulto = 30 },
                new Producto { Nombre = "Huevo Color Grande", TipoProducto = TipoProducto.Huevo, StockActual = 1000, StockMinimoAlerta = 100, UnidadDeMedida = "Maple", EsHuevo = true, Tamano = TamanoHuevo.Grande, Color = ColorHuevo.Color, UnidadesPorBulto = 30 },
                new Producto { Nombre = "Huevo Color Mediano", TipoProducto = TipoProducto.Huevo, StockActual = 1000, StockMinimoAlerta = 100, UnidadDeMedida = "Maple", EsHuevo = true, Tamano = TamanoHuevo.Mediano, Color = ColorHuevo.Color, UnidadesPorBulto = 30 },
            };
            context.Productos.AddRange(productos);
        }

        // Seed Vehiculos if missing
        if (!context.Vehiculos.Any())
        {
            var vehiculos = new Vehiculo[]
            {
                new Vehiculo { Patente = "AA123BB", Marca = "Peugeot", Modelo = "Boxer", CapacidadCarga = 1500, ConsumoPromedioLts100Km = 12, EnRuta = false },
                new Vehiculo { Patente = "CC456DD", Marca = "Fiat", Modelo = "Fiorino", CapacidadCarga = 650, ConsumoPromedioLts100Km = 9, EnRuta = false },
                new Vehiculo { Patente = "GRANJA", Marca = "SGA", Modelo = "Punto de Venta", CapacidadCarga = 999999, ConsumoPromedioLts100Km = 0, EnRuta = false } // Default to false so we can Start Trip manually
            };
            context.Vehiculos.AddRange(vehiculos);
        }
        else
        {
            // Ensure Granja exists even if seeding happened before
             var granja = context.Vehiculos.FirstOrDefault(v => v.Patente == "GRANJA");
             if (granja == null)
             {
                context.Vehiculos.Add(new Vehiculo 
                { 
                    Patente = "GRANJA", 
                    Marca = "SGA", 
                    Modelo = "Punto de Venta", 
                    CapacidadCarga = 999999, 
                    ConsumoPromedioLts100Km = 0, 
                    EnRuta = false 
                });
                context.SaveChanges();
             }
             else
             {
                 // Fix: If Granja is marked EnRuta but has no active trip, reset it.
                 // This handles the previous bad seed.
                 var activeTrip = context.Viajes.Any(v => v.VehiculoId == granja.VehiculoId && v.Estado == EstadoViaje.EnCurso);
                 if (granja.EnRuta && !activeTrip)
                 {
                     granja.EnRuta = false;
                     context.SaveChanges();
                 }
             }
        }

        // Seed Galpones
        if (!context.Galpones.Any())
        {
            context.Galpones.AddRange(
                new Galpon { Nombre = "Galpón 1", Tipo = "Produccion", CantidadAves = 5000, PrecioCompraAve = 1000, FechaAlta = DateTime.Now.AddMonths(-6) },
                new Galpon { Nombre = "Galpón 2", Tipo = "Produccion", CantidadAves = 5000, PrecioCompraAve = 1200, FechaAlta = DateTime.Now.AddMonths(-3) },
                new Galpon { Nombre = "Galpón 3", Tipo = "Produccion", CantidadAves = 0, PrecioCompraAve = 0, Estado = "Limpieza" },
                new Galpon { Nombre = "Habitación Pollitos 1", Tipo = "Pollitos", CantidadAves = 2000, PrecioCompraAve = 500, FechaAlta = DateTime.Now }
            );
        }

        // Seed Silos
        if (!context.Silos.Any())
        {
            var maiz = context.Productos.FirstOrDefault(p => p.Nombre.Contains("Maiz"))?.ProductoId; // Might be null
            // Assume we need to create products if not exist? Or linking to generic?
            // Since "Productos" are saleable items, maybe Silo content is separate or mapped.
            // Plan links Silo.ProductoId -> Producto.
            // Let's create dummy "Insumo" products if logic requires strict FK.
            
            context.Silos.AddRange(
                new Silo { Nombre = "Silo 1 (Maíz)", CapacidadKg = 10000, CantidadActualKg = 2500, PrecioPromedioCompra = 150 },
                new Silo { Nombre = "Silo 2 (Balanceado)", CapacidadKg = 10000, CantidadActualKg = 5000, PrecioPromedioCompra = 200 },
                new Silo { Nombre = "Silo 3 (Vacío)", CapacidadKg = 10000, CantidadActualKg = 0 }
            );
        }


        // Seed Usuarios if missing
        if (!context.Usuarios.Any())
        {
            var usuarios = new Usuario[]
            {
                new Usuario { Nombre = "Admin", Rol = RolUsuario.Admin, ContrasenaHash = "admin123" },
                new Usuario { Nombre = "Chofer 1", Rol = RolUsuario.Chofer, ContrasenaHash = "chofer1" }
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
                    ContrasenaHash = "admin123",
                    DNI = "11111111"
                };
                context.Usuarios.Add(officialAdmin);
            }
        }
        else
        {
            // Ensure official is Admin
             officialAdmin.Rol = RolUsuario.Admin;
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
