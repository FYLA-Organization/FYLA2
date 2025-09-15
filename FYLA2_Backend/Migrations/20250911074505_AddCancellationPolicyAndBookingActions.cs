using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FYLA2_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddCancellationPolicyAndBookingActions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BookingActions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    BookingId = table.Column<int>(type: "INTEGER", nullable: false),
                    ActionType = table.Column<string>(type: "TEXT", nullable: false),
                    RequestedBy = table.Column<string>(type: "TEXT", nullable: false),
                    NewBookingDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    NewStartTime = table.Column<DateTime>(type: "TEXT", nullable: true),
                    NewEndTime = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Reason = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    FeeAmount = table.Column<decimal>(type: "TEXT", nullable: false),
                    RefundAmount = table.Column<decimal>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    ProviderNotes = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ProcessedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    RequestedByUserId = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookingActions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BookingActions_AspNetUsers_RequestedByUserId",
                        column: x => x.RequestedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_BookingActions_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CancellationPolicies",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ProviderId = table.Column<string>(type: "TEXT", nullable: false),
                    SameDayFeePercentage = table.Column<decimal>(type: "TEXT", nullable: false),
                    OneDayBeforeFeePercentage = table.Column<decimal>(type: "TEXT", nullable: false),
                    TwoDaysBeforeFeePercentage = table.Column<decimal>(type: "TEXT", nullable: false),
                    ThreeDaysBeforeFeePercentage = table.Column<decimal>(type: "TEXT", nullable: false),
                    OneWeekBeforeFeePercentage = table.Column<decimal>(type: "TEXT", nullable: false),
                    FreeReschedulesAllowed = table.Column<int>(type: "INTEGER", nullable: false),
                    RescheduleFeePercentage = table.Column<decimal>(type: "TEXT", nullable: false),
                    MinimumRescheduleHours = table.Column<int>(type: "INTEGER", nullable: false),
                    AllowSameDayCancellation = table.Column<bool>(type: "INTEGER", nullable: false),
                    AllowSameDayReschedule = table.Column<bool>(type: "INTEGER", nullable: false),
                    RefundProcessingFee = table.Column<bool>(type: "INTEGER", nullable: false),
                    PolicyDescription = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    SpecialCircumstances = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CancellationPolicies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CancellationPolicies_AspNetUsers_ProviderId",
                        column: x => x.ProviderId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BookingActions_BookingId",
                table: "BookingActions",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_BookingActions_RequestedByUserId",
                table: "BookingActions",
                column: "RequestedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CancellationPolicies_ProviderId",
                table: "CancellationPolicies",
                column: "ProviderId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BookingActions");

            migrationBuilder.DropTable(
                name: "CancellationPolicies");
        }
    }
}
