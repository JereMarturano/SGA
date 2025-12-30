using Microsoft.EntityFrameworkCore;
using SGA.Data;
using SGA.Services;
using Serilog;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.HttpOverrides;



AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
builder.Host.UseSerilog((context, services, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/sga-.txt", rollingInterval: RollingInterval.Day));

// Add services to the container.
// Helper to handle URI connection strings (Render/Supabase style)
static string BuildConnectionString(string? connectionUrl)
{
    if (string.IsNullOrEmpty(connectionUrl)) return string.Empty;

    try 
    {
        // If it's not a URI, return as is (assume key=value format)
        if (!connectionUrl.Contains("://")) return connectionUrl;

        var uri = new Uri(connectionUrl);
        var userInfo = uri.UserInfo.Split(':');
        var builder = new Npgsql.NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.Port,
            Database = uri.AbsolutePath.TrimStart('/'),
            Username = userInfo.FirstOrDefault(),
            Password = userInfo.Length > 1 ? userInfo[1] : null,
            SslMode = Npgsql.SslMode.Require,
            TrustServerCertificate = true // Allow self-signed certificates common in cloud
        };

        return builder.ToString();
    }
    catch 
    {
        // Fallback if parsing fails
        return connectionUrl;
    }
}

// Add services to the container.
builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connString = builder.Configuration.GetConnectionString("DefaultConnection");
    var finalConnString = BuildConnectionString(connString);
    options.UseNpgsql(finalConnString);
});

builder.Services.AddScoped<DatabaseMigrationService>();

builder.Services.AddScoped<IClienteService, ClienteService>();
builder.Services.AddScoped<IGastoVehiculoService, GastoVehiculoService>();
builder.Services.AddScoped<IInventarioService, InventarioService>();
builder.Services.AddScoped<IVentaService, VentaService>();
builder.Services.AddScoped<IReporteService, ReporteService>();
builder.Services.AddScoped<INotificacionService, NotificacionService>();
builder.Services.AddScoped<IAlertaService, AlertaService>();
builder.Services.AddScoped<IEmpleadoService, EmpleadoService>();
builder.Services.AddScoped<IVehiculoService, VehiculoService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IViajeService, ViajeService>();
builder.Services.AddScoped<IRestorationService, RestorationService>();
builder.Services.AddScoped<IStockGeneralService, StockGeneralService>();

builder.Services.AddScoped<IGalponService, GalponService>();
builder.Services.AddScoped<ISiloService, SiloService>();
builder.Services.AddScoped<IFabricaService, FabricaService>();
builder.Services.AddScoped<ICierreCajaService, CierreCajaService>();
builder.Services.AddScoped<IPedidoService, PedidoService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

builder.Services.AddHostedService<AsistenciaBackgroundService>();
builder.Services.AddControllers().AddJsonOptions(x =>
                x.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure Forwarded Headers for Render/Proxies
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder =>
        {
            builder.AllowAnyOrigin()
                   .AllowAnyMethod()
                   .AllowAnyHeader();
        });
});



var app = builder.Build();

// Configure the HTTP request pipeline.
// UseForwardedHeaders must be first middleware to handle proxy headers correctly
app.UseForwardedHeaders();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    // In production, ensure we are logging errors visible in Render console
    app.UseDeveloperExceptionPage(); // Temporary: Enable detailed errors for debugging this 500 issue
}

app.UseCors("AllowAll");

// app.UseHttpsRedirection(); // Disable HTTPS redirection behind proxy to avoid loops if misconfigured

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Apply migrations at startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    var config = services.GetRequiredService<IConfiguration>();

    // DEBUG: Check Connection String
    var connString = config.GetConnectionString("DefaultConnection");
    if (string.IsNullOrEmpty(connString) || connString.Contains("127.0.0.1"))
    {
        logger.LogWarning("WARNING: Using default/localhost connection string. This will fail on Render unless you invoke a local DB.");
        if (connString != null)
            logger.LogInformation("Connection String (First 20 chars): {ConnStr}", connString.Substring(0, Math.Min(20, connString.Length)));
        else
            logger.LogInformation("Connection String is NULL");
    }
    else
    {
        logger.LogInformation("Using Production Connection String.");
    }

    var context = services.GetRequiredService<AppDbContext>();

    // APPLY EF CORE MIGRATIONS PROPERLY
    // This ensures the database schema exists on Supabase/Render
    logger.LogInformation("Applying EF Core Migrations...");
    try 
    {
        context.Database.Migrate();
        logger.LogInformation("Migrations Applied Successfully.");
    }
    catch (Exception ex)
    {
        // Log full details but DO NOT THROW to avoid crashing the container loop (Error 139)
        // Sometimes migration fails but DB is usable.
        logger.LogError(ex, "MIGRATION ERROR DETAILS: {Message} | {InnerException}", ex.Message, ex.InnerException?.Message);
        // We continue to allow the app to run if possible
    }

    try
    {
        DbInitializer.Initialize(context);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while seeding the database.");
    }
}

app.Run();
