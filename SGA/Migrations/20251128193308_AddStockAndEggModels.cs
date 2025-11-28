using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SGA.Migrations
{
    /// <inheritdoc />
    public partial class AddStockAndEggModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Color",
                table: "Productos",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EsHuevo",
                table: "Productos",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "Tamano",
                table: "Productos",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UnidadesPorBulto",
                table: "Productos",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "MovimientosStock",
                columns: table => new
                {
                    MovimientoId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Fecha = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TipoMovimiento = table.Column<int>(type: "integer", nullable: false),
                    VehiculoId = table.Column<int>(type: "integer", nullable: true),
                    ProductoId = table.Column<int>(type: "integer", nullable: false),
                    Cantidad = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    UsuarioId = table.Column<int>(type: "integer", nullable: false),
                    Observaciones = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovimientosStock", x => x.MovimientoId);
                    table.ForeignKey(
                        name: "FK_MovimientosStock_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "ProductoId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MovimientosStock_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "UsuarioId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MovimientosStock_Vehiculos_VehiculoId",
                        column: x => x.VehiculoId,
                        principalTable: "Vehiculos",
                        principalColumn: "VehiculoId");
                });

            migrationBuilder.CreateTable(
                name: "StockVehiculos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    VehiculoId = table.Column<int>(type: "integer", nullable: false),
                    ProductoId = table.Column<int>(type: "integer", nullable: false),
                    Cantidad = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    UltimaActualizacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StockVehiculos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StockVehiculos_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "ProductoId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StockVehiculos_Vehiculos_VehiculoId",
                        column: x => x.VehiculoId,
                        principalTable: "Vehiculos",
                        principalColumn: "VehiculoId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MovimientosStock_ProductoId",
                table: "MovimientosStock",
                column: "ProductoId");

            migrationBuilder.CreateIndex(
                name: "IX_MovimientosStock_UsuarioId",
                table: "MovimientosStock",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_MovimientosStock_VehiculoId",
                table: "MovimientosStock",
                column: "VehiculoId");

            migrationBuilder.CreateIndex(
                name: "IX_StockVehiculos_ProductoId",
                table: "StockVehiculos",
                column: "ProductoId");

            migrationBuilder.CreateIndex(
                name: "IX_StockVehiculos_VehiculoId",
                table: "StockVehiculos",
                column: "VehiculoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MovimientosStock");

            migrationBuilder.DropTable(
                name: "StockVehiculos");

            migrationBuilder.DropColumn(
                name: "Color",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "EsHuevo",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "Tamano",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "UnidadesPorBulto",
                table: "Productos");
        }
    }
}
