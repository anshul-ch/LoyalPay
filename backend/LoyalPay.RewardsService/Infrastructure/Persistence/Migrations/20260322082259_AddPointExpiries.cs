using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LoyalPay.RewardsService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPointExpiries : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PointExpiries",
                columns: table => new
                {
                    ExpiryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Points = table.Column<int>(type: "int", nullable: false),
                    EarnedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsExpired = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PointExpiries", x => x.ExpiryId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PointExpiries_UserId_ExpiresAt",
                table: "PointExpiries",
                columns: new[] { "UserId", "ExpiresAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PointExpiries");
        }
    }
}
