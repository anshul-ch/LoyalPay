using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LoyalPay.AuthService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMustResetPinToUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "MustResetPin",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MustResetPin",
                table: "Users");
        }
    }
}
