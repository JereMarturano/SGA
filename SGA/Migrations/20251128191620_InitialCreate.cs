using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SGA.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Clientes",
                columns: table => new
                {
                    ClienteId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    NombreCompleto = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DNI = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Telefono = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Email = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Direccion = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    FechaCumpleanios = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RequiereFactura = table.Column<bool>(type: "boolean", nullable: false),
                    PrecioEspecial = table.Column<decimal>(type: "numeric(18,2)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Clientes", x => x.ClienteId);
                });

            migrationBuilder.CreateTable(
                name: "Productos",
                columns: table => new
                {
                    ProductoId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TipoProducto = table.Column<int>(type: "integer", nullable: false),
                    StockActual = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    StockMinimoAlerta = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    UnidadDeMedida = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Productos", x => x.ProductoId);
                });

            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    UsuarioId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Rol = table.Column<int>(type: "integer", nullable: false),
                    ContrasenaHash = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.UsuarioId);
                });

            migrationBuilder.CreateTable(
                name: "Vehiculos",
                columns: table => new
                {
                    VehiculoId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Patente = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Marca = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Modelo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ConsumoPromedioLts100Km = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    CapacidadCarga = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    ID_Chofer_Asignado = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Vehiculos", x => x.VehiculoId);
                    table.ForeignKey(
                        name: "FK_Vehiculos_Usuarios_ID_Chofer_Asignado",
                        column: x => x.ID_Chofer_Asignado,
                        principalTable: "Usuarios",
                        principalColumn: "UsuarioId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Clientes_DNI",
                table: "Clientes",
                column: "DNI",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Vehiculos_ID_Chofer_Asignado",
                table: "Vehiculos",
                column: "ID_Chofer_Asignado");

            migrationBuilder.CreateIndex(
                name: "IX_Vehiculos_Patente",
                table: "Vehiculos",
                column: "Patente",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Clientes");

            migrationBuilder.DropTable(
                name: "Productos");

            migrationBuilder.DropTable(
                name: "Vehiculos");

            migrationBuilder.DropTable(
                name: "Usuarios");
        }
    }
}
