using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SGA.Migrations
{
    /// <inheritdoc />
    public partial class AddProduccionIngredientes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Producciones_Silos_SiloOrigenId",
                table: "Producciones");

            migrationBuilder.DropIndex(
                name: "IX_Producciones_SiloOrigenId",
                table: "Producciones");

            migrationBuilder.DropColumn(
                name: "SiloOrigenId",
                table: "Producciones");

            migrationBuilder.CreateTable(
                name: "ProduccionIngredientes",
                columns: table => new
                {
                    ProduccionIngredienteId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProduccionId = table.Column<int>(type: "int", nullable: false),
                    SiloId = table.Column<int>(type: "int", nullable: false),
                    CantidadKg = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProduccionIngredientes", x => x.ProduccionIngredienteId);
                    table.ForeignKey(
                        name: "FK_ProduccionIngredientes_Producciones_ProduccionId",
                        column: x => x.ProduccionId,
                        principalTable: "Producciones",
                        principalColumn: "ProduccionId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProduccionIngredientes_Silos_SiloId",
                        column: x => x.SiloId,
                        principalTable: "Silos",
                        principalColumn: "SiloId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProduccionIngredientes_ProduccionId",
                table: "ProduccionIngredientes",
                column: "ProduccionId");

            migrationBuilder.CreateIndex(
                name: "IX_ProduccionIngredientes_SiloId",
                table: "ProduccionIngredientes",
                column: "SiloId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProduccionIngredientes");

            migrationBuilder.AddColumn<int>(
                name: "SiloOrigenId",
                table: "Producciones",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Producciones_SiloOrigenId",
                table: "Producciones",
                column: "SiloOrigenId");

            migrationBuilder.AddForeignKey(
                name: "FK_Producciones_Silos_SiloOrigenId",
                table: "Producciones",
                column: "SiloOrigenId",
                principalTable: "Silos",
                principalColumn: "SiloId");
        }
    }
}
