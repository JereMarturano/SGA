using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SGA.Migrations
{
    /// <inheritdoc />
    public partial class AddStockGeneralTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Galpones",
                columns: table => new
                {
                    GalponId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Tipo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CantidadAves = table.Column<int>(type: "int", nullable: false),
                    FechaAlta = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaBajaEstimada = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PrecioCompraAve = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Galpones", x => x.GalponId);
                });

            migrationBuilder.CreateTable(
                name: "Silos",
                columns: table => new
                {
                    SiloId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CapacidadKg = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CantidadActualKg = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ProductoId = table.Column<int>(type: "int", nullable: true),
                    PrecioPromedioCompra = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Silos", x => x.SiloId);
                    table.ForeignKey(
                        name: "FK_Silos_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "ProductoId");
                });

            migrationBuilder.CreateTable(
                name: "EventosGalpon",
                columns: table => new
                {
                    EventoId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GalponId = table.Column<int>(type: "int", nullable: false),
                    Fecha = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TipoEvento = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Cantidad = table.Column<int>(type: "int", nullable: false),
                    Observacion = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    UsuarioId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventosGalpon", x => x.EventoId);
                    table.ForeignKey(
                        name: "FK_EventosGalpon_Galpones_GalponId",
                        column: x => x.GalponId,
                        principalTable: "Galpones",
                        principalColumn: "GalponId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EventosGalpon_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "UsuarioId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Producciones",
                columns: table => new
                {
                    ProduccionId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Fecha = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SiloOrigenId = table.Column<int>(type: "int", nullable: true),
                    SiloDestinoId = table.Column<int>(type: "int", nullable: true),
                    CantidadKg = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Observacion = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    UsuarioId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Producciones", x => x.ProduccionId);
                    table.ForeignKey(
                        name: "FK_Producciones_Silos_SiloDestinoId",
                        column: x => x.SiloDestinoId,
                        principalTable: "Silos",
                        principalColumn: "SiloId");
                    table.ForeignKey(
                        name: "FK_Producciones_Silos_SiloOrigenId",
                        column: x => x.SiloOrigenId,
                        principalTable: "Silos",
                        principalColumn: "SiloId");
                    table.ForeignKey(
                        name: "FK_Producciones_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "UsuarioId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EventosGalpon_GalponId",
                table: "EventosGalpon",
                column: "GalponId");

            migrationBuilder.CreateIndex(
                name: "IX_EventosGalpon_UsuarioId",
                table: "EventosGalpon",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Producciones_SiloDestinoId",
                table: "Producciones",
                column: "SiloDestinoId");

            migrationBuilder.CreateIndex(
                name: "IX_Producciones_SiloOrigenId",
                table: "Producciones",
                column: "SiloOrigenId");

            migrationBuilder.CreateIndex(
                name: "IX_Producciones_UsuarioId",
                table: "Producciones",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Silos_ProductoId",
                table: "Silos",
                column: "ProductoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EventosGalpon");

            migrationBuilder.DropTable(
                name: "Producciones");

            migrationBuilder.DropTable(
                name: "Galpones");

            migrationBuilder.DropTable(
                name: "Silos");
        }
    }
}
