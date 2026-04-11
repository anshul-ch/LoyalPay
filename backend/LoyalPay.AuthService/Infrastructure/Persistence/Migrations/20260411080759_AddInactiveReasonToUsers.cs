using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LoyalPay.AuthService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddInactiveReasonToUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "InactiveReason",
                table: "Users",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InactiveReason",
                table: "Users");
        }
    }
}
