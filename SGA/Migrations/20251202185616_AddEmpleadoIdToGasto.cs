using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SGA.Migrations
{
    /// <inheritdoc />
    public partial class AddEmpleadoIdToGasto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "EmpleadoId",
                table: "GastosVehiculos",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_GastosVehiculos_EmpleadoId",
                table: "GastosVehiculos",
                column: "EmpleadoId");

            migrationBuilder.AddForeignKey(
                name: "FK_GastosVehiculos_Usuarios_EmpleadoId",
                table: "GastosVehiculos",
                column: "EmpleadoId",
                principalTable: "Usuarios",
                principalColumn: "UsuarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_GastosVehiculos_Usuarios_EmpleadoId",
                table: "GastosVehiculos");

            migrationBuilder.DropIndex(
                name: "IX_GastosVehiculos_EmpleadoId",
                table: "GastosVehiculos");

            migrationBuilder.DropColumn(
                name: "EmpleadoId",
                table: "GastosVehiculos");
        }
    }
}
