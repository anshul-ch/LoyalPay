using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LoyalPay.AuthService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class KycDbStorage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add binary storage columns to KycSubmissions.
            migrationBuilder.AddColumn<byte[]>(
                name: "FileData",
                table: "KycSubmissions",
                type: "varbinary(max)",
                nullable: false,
                defaultValue: Array.Empty<byte>());

            migrationBuilder.AddColumn<string>(
                name: "FileName",
                table: "KycSubmissions",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ContentType",
                table: "KycSubmissions",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "image/jpeg");

            // Remove the old filesystem path column.
            migrationBuilder.DropColumn(
                name: "FilePath",
                table: "KycSubmissions");

            // Remove the denormalised file path from Users — document lives in KycSubmissions now.
            migrationBuilder.DropColumn(
                name: "KycFilePath",
                table: "Users");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "FileData",    table: "KycSubmissions");
            migrationBuilder.DropColumn(name: "FileName",    table: "KycSubmissions");
            migrationBuilder.DropColumn(name: "ContentType", table: "KycSubmissions");

            migrationBuilder.AddColumn<string>(
                name: "FilePath",
                table: "KycSubmissions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "KycFilePath",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
