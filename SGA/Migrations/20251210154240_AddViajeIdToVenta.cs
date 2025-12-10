using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SGA.Migrations
{
    /// <inheritdoc />
    public partial class AddViajeIdToVenta : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ViajeId",
                table: "Ventas",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Ventas_ViajeId",
                table: "Ventas",
                column: "ViajeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Ventas_Viajes_ViajeId",
                table: "Ventas",
                column: "ViajeId",
                principalTable: "Viajes",
                principalColumn: "ViajeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Ventas_Viajes_ViajeId",
                table: "Ventas");

            migrationBuilder.DropIndex(
                name: "IX_Ventas_ViajeId",
                table: "Ventas");

            migrationBuilder.DropColumn(
                name: "ViajeId",
                table: "Ventas");
        }
    }
}
