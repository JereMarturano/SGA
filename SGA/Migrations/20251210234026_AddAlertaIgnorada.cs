using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SGA.Migrations
{
    /// <inheritdoc />
    public partial class AddAlertaIgnorada : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AlertasIgnoradas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClaveUnica = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FechaIgnorada = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AlertasIgnoradas", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AlertasIgnoradas");
        }
    }
}
