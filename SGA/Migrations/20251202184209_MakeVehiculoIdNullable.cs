using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SGA.Migrations
{
    /// <inheritdoc />
    public partial class MakeVehiculoIdNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_GastosVehiculos_Vehiculos_VehiculoId",
                table: "GastosVehiculos");

            migrationBuilder.AlterColumn<int>(
                name: "VehiculoId",
                table: "GastosVehiculos",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            /* 
            migrationBuilder.CreateTable(
                name: "Pagos",
                columns: table => new
                {
                    PagoId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClienteId = table.Column<int>(type: "int", nullable: false),
                    Fecha = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Monto = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MetodoPago = table.Column<int>(type: "int", nullable: false),
                    Observacion = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pagos", x => x.PagoId);
                    table.ForeignKey(
                        name: "FK_Pagos_Clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Clientes",
                        principalColumn: "ClienteId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Pagos_ClienteId",
                table: "Pagos",
                column: "ClienteId");
            */

            migrationBuilder.AddForeignKey(
                name: "FK_GastosVehiculos_Vehiculos_VehiculoId",
                table: "GastosVehiculos",
                column: "VehiculoId",
                principalTable: "Vehiculos",
                principalColumn: "VehiculoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_GastosVehiculos_Vehiculos_VehiculoId",
                table: "GastosVehiculos");

            migrationBuilder.DropTable(
                name: "Pagos");

            migrationBuilder.AlterColumn<int>(
                name: "VehiculoId",
                table: "GastosVehiculos",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_GastosVehiculos_Vehiculos_VehiculoId",
                table: "GastosVehiculos",
                column: "VehiculoId",
                principalTable: "Vehiculos",
                principalColumn: "VehiculoId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
