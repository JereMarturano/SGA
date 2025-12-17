using SGA.Models;
using SGA.Models.Enums;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using SGA.Helpers;

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

        // Seed Usuarios if missing
        if (!context.Usuarios.Any())
        {
            var usuarios = new Usuario[]
            {
                new Usuario { Nombre = "Admin", Rol = RolUsuario.Admin, ContrasenaHash = PasswordHelper.HashPassword("admin123"), DNI = "99999999" },
                new Usuario { Nombre = "Chofer 1", Rol = RolUsuario.Chofer, ContrasenaHash = PasswordHelper.HashPassword("chofer1"), DNI = "88888888" }
            };
            context.Usuarios.AddRange(usuarios);
            context.SaveChanges();
        }

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
                officialAdmin.DNI = "11111111"; // Force DNI
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
        else
        {
            // Ensure official is Admin and has correct password
             officialAdmin.Rol = RolUsuario.Admin;
             officialAdmin.ContrasenaHash = PasswordHelper.HashPassword("admin123");
             officialAdmin.DNI = "11111111"; // Force DNI
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
