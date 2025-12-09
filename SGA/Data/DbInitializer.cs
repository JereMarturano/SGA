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
                new Vehiculo { Patente = "CC456DD", Marca = "Fiat", Modelo = "Fiorino", CapacidadCarga = 650, ConsumoPromedioLts100Km = 9, EnRuta = false }
            };
            context.Vehiculos.AddRange(vehiculos);
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
    }
}
