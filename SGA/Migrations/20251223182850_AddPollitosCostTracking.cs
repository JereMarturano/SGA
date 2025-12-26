using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SGA.Migrations
{
    /// <inheritdoc />
    public partial class AddPollitosCostTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Costo",
                table: "EventosGalpon",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "ProductoId",
                table: "EventosGalpon",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_EventosGalpon_ProductoId",
                table: "EventosGalpon",
                column: "ProductoId");

            migrationBuilder.AddForeignKey(
                name: "FK_EventosGalpon_Productos_ProductoId",
                table: "EventosGalpon",
                column: "ProductoId",
                principalTable: "Productos",
                principalColumn: "ProductoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EventosGalpon_Productos_ProductoId",
                table: "EventosGalpon");

            migrationBuilder.DropIndex(
                name: "IX_EventosGalpon_ProductoId",
                table: "EventosGalpon");

            migrationBuilder.DropColumn(
                name: "Costo",
                table: "EventosGalpon");

            migrationBuilder.DropColumn(
                name: "ProductoId",
                table: "EventosGalpon");
        }
    }
}
