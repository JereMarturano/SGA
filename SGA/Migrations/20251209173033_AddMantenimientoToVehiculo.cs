using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SGA.Migrations
{
    /// <inheritdoc />
    public partial class AddMantenimientoToVehiculo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Estado",
                table: "Vehiculos",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "EstadoCubiertas",
                table: "Vehiculos",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "KilometrajeProximoCambioAceite",
                table: "Vehiculos",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Notas",
                table: "Vehiculos",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TipoAceite",
                table: "Vehiculos",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UltimoCambioAceite",
                table: "Vehiculos",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Estado",
                table: "Vehiculos");

            migrationBuilder.DropColumn(
                name: "EstadoCubiertas",
                table: "Vehiculos");

            migrationBuilder.DropColumn(
                name: "KilometrajeProximoCambioAceite",
                table: "Vehiculos");

            migrationBuilder.DropColumn(
                name: "Notas",
                table: "Vehiculos");

            migrationBuilder.DropColumn(
                name: "TipoAceite",
                table: "Vehiculos");

            migrationBuilder.DropColumn(
                name: "UltimoCambioAceite",
                table: "Vehiculos");
        }
    }
}
