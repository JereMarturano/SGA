using Microsoft.EntityFrameworkCore;
using SGA.Data;
using SGA.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IClienteService, ClienteService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    // Swagger/OpenAPI can be added here if needed
}

app.UseHttpsRedirection();

app.Run();
