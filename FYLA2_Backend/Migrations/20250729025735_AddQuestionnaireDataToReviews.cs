using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FYLA2_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddQuestionnaireDataToReviews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reviews_Services_ServiceId",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_ServiceId",
                table: "Reviews");

            migrationBuilder.AlterColumn<string>(
                name: "ServiceId",
                table: "Reviews",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "INTEGER",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Id",
                table: "Reviews",
                type: "TEXT",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "INTEGER")
                .OldAnnotation("Sqlite:Autoincrement", true);

            migrationBuilder.AddColumn<string>(
                name: "QuestionnaireData",
                table: "Reviews",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ServiceId1",
                table: "Reviews",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "StripePaymentIntentId",
                table: "PaymentRecords",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT");

            migrationBuilder.AlterColumn<string>(
                name: "PaymentMethod",
                table: "Bookings",
                type: "TEXT",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldMaxLength: 50);

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_ServiceId1",
                table: "Reviews",
                column: "ServiceId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Reviews_Services_ServiceId1",
                table: "Reviews",
                column: "ServiceId1",
                principalTable: "Services",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reviews_Services_ServiceId1",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_ServiceId1",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "QuestionnaireData",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "ServiceId1",
                table: "Reviews");

            migrationBuilder.AlterColumn<int>(
                name: "ServiceId",
                table: "Reviews",
                type: "INTEGER",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "Id",
                table: "Reviews",
                type: "INTEGER",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "TEXT")
                .Annotation("Sqlite:Autoincrement", true);

            migrationBuilder.AlterColumn<string>(
                name: "StripePaymentIntentId",
                table: "PaymentRecords",
                type: "TEXT",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "PaymentMethod",
                table: "Bookings",
                type: "TEXT",
                maxLength: 50,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_ServiceId",
                table: "Reviews",
                column: "ServiceId");

            migrationBuilder.AddForeignKey(
                name: "FK_Reviews_Services_ServiceId",
                table: "Reviews",
                column: "ServiceId",
                principalTable: "Services",
                principalColumn: "Id");
        }
    }
}
