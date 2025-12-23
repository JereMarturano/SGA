using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SGA.Migrations
{
    /// <inheritdoc />
    public partial class AddAcompananteToViaje : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AcompananteId",
                table: "Viajes",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ContenidosSilos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SiloId = table.Column<int>(type: "int", nullable: false),
                    NombreMaterial = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Cantidad = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    UnidadMedida = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CostoPorUnidad = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    UltimaActualizacion = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContenidosSilos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContenidosSilos_Silos_SiloId",
                        column: x => x.SiloId,
                        principalTable: "Silos",
                        principalColumn: "SiloId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Ubicaciones",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Tipo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Ubicaciones", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ItemsInventario",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    UbicacionId = table.Column<int>(type: "int", nullable: false),
                    Cantidad = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    UnidadMedida = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Categoria = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItemsInventario", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ItemsInventario_Ubicaciones_UbicacionId",
                        column: x => x.UbicacionId,
                        principalTable: "Ubicaciones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LotesAves",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UbicacionId = table.Column<int>(type: "int", nullable: false),
                    TipoAve = table.Column<int>(type: "int", nullable: false),
                    CantidadInicial = table.Column<int>(type: "int", nullable: false),
                    CantidadActual = table.Column<int>(type: "int", nullable: false),
                    FechaAlta = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaBaja = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PrecioCompra = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Activo = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LotesAves", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LotesAves_Ubicaciones_UbicacionId",
                        column: x => x.UbicacionId,
                        principalTable: "Ubicaciones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventosMortalidad",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LoteId = table.Column<int>(type: "int", nullable: false),
                    Fecha = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Cantidad = table.Column<int>(type: "int", nullable: false),
                    Motivo = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    UsuarioId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventosMortalidad", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventosMortalidad_LotesAves_LoteId",
                        column: x => x.LoteId,
                        principalTable: "LotesAves",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Viajes_AcompananteId",
                table: "Viajes",
                column: "AcompananteId");

            migrationBuilder.CreateIndex(
                name: "IX_ContenidosSilos_SiloId",
                table: "ContenidosSilos",
                column: "SiloId");

            migrationBuilder.CreateIndex(
                name: "IX_EventosMortalidad_LoteId",
                table: "EventosMortalidad",
                column: "LoteId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemsInventario_UbicacionId",
                table: "ItemsInventario",
                column: "UbicacionId");

            migrationBuilder.CreateIndex(
                name: "IX_LotesAves_UbicacionId",
                table: "LotesAves",
                column: "UbicacionId");

            migrationBuilder.AddForeignKey(
                name: "FK_Viajes_Usuarios_AcompananteId",
                table: "Viajes",
                column: "AcompananteId",
                principalTable: "Usuarios",
                principalColumn: "UsuarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Viajes_Usuarios_AcompananteId",
                table: "Viajes");

            migrationBuilder.DropTable(
                name: "ContenidosSilos");

            migrationBuilder.DropTable(
                name: "EventosMortalidad");

            migrationBuilder.DropTable(
                name: "ItemsInventario");

            migrationBuilder.DropTable(
                name: "LotesAves");

            migrationBuilder.DropTable(
                name: "Ubicaciones");

            migrationBuilder.DropIndex(
                name: "IX_Viajes_AcompananteId",
                table: "Viajes");

            migrationBuilder.DropColumn(
                name: "AcompananteId",
                table: "Viajes");
        }
    }
}
