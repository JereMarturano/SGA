using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using SGA.Data;
using SGA.Models;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var productos = context.Productos.ToList();
    foreach (var p in productos)
    {
        Console.WriteLine($"Producto: {p.Nombre}, Costo: {p.CostoUltimaCompra}");
        if (p.CostoUltimaCompra == 0)
        {
            p.CostoUltimaCompra = 100; // Set a dummy cost
            Console.WriteLine($"Updating cost for {p.Nombre} to 100");
        }
    }
    context.SaveChanges();
}
