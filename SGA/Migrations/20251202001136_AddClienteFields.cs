using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SGA.Migrations
{
    /// <inheritdoc />
    public partial class AddClienteFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Removed redundant AddColumn for Kilometraje as it is handled in previous migration

            migrationBuilder.AddColumn<decimal>(
                name: "Deuda",
                table: "Clientes",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "Estado",
                table: "Clientes",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "MetodoPagoPreferido",
                table: "Clientes",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UltimaCompra",
                table: "Clientes",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "VentasTotales",
                table: "Clientes",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Removed redundant DropColumn for Kilometraje

            migrationBuilder.DropColumn(
                name: "Deuda",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "Estado",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "MetodoPagoPreferido",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "UltimaCompra",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "VentasTotales",
                table: "Clientes");
        }
    }
}
