using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LoyalPay.RewardsService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCatalogItemExpiry : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ExpiresAt",
                table: "CatalogItems",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CatalogItems_IsActive_ExpiresAt",
                table: "CatalogItems",
                columns: new[] { "IsActive", "ExpiresAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_CatalogItems_IsActive_ExpiresAt",
                table: "CatalogItems");

            migrationBuilder.DropColumn(
                name: "ExpiresAt",
                table: "CatalogItems");
        }
    }
}
