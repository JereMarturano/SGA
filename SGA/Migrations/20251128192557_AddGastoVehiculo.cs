using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SGA.Migrations
{
    /// <inheritdoc />
    public partial class AddGastoVehiculo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GastosVehiculos",
                columns: table => new
                {
                    GastoId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    VehiculoId = table.Column<int>(type: "integer", nullable: false),
                    Fecha = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Monto = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Tipo = table.Column<int>(type: "integer", nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    Kilometraje = table.Column<int>(type: "integer", nullable: true),
                    LitrosCombustible = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    UsuarioId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GastosVehiculos", x => x.GastoId);
                    table.ForeignKey(
                        name: "FK_GastosVehiculos_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "UsuarioId");
                    table.ForeignKey(
                        name: "FK_GastosVehiculos_Vehiculos_VehiculoId",
                        column: x => x.VehiculoId,
                        principalTable: "Vehiculos",
                        principalColumn: "VehiculoId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GastosVehiculos_UsuarioId",
                table: "GastosVehiculos",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_GastosVehiculos_VehiculoId",
                table: "GastosVehiculos",
                column: "VehiculoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GastosVehiculos");
        }
    }
}
