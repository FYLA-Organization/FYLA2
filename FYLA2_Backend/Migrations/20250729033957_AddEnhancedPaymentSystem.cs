using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FYLA2_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddEnhancedPaymentSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PaymentSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ProviderId = table.Column<string>(type: "TEXT", nullable: false),
                    PaymentStructure = table.Column<int>(type: "INTEGER", nullable: false),
                    DepositPercentage = table.Column<decimal>(type: "TEXT", precision: 5, scale: 2, nullable: false),
                    TaxRate = table.Column<decimal>(type: "TEXT", precision: 5, scale: 2, nullable: false),
                    AcceptStripe = table.Column<bool>(type: "INTEGER", nullable: false),
                    AcceptPayPal = table.Column<bool>(type: "INTEGER", nullable: false),
                    AcceptApplePay = table.Column<bool>(type: "INTEGER", nullable: false),
                    AcceptGooglePay = table.Column<bool>(type: "INTEGER", nullable: false),
                    AcceptKlarna = table.Column<bool>(type: "INTEGER", nullable: false),
                    AcceptBankTransfer = table.Column<bool>(type: "INTEGER", nullable: false),
                    AutoRefundEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    RefundTimeoutHours = table.Column<int>(type: "INTEGER", nullable: false),
                    StripeConnectAccountId = table.Column<string>(type: "TEXT", nullable: true),
                    PayPalBusinessEmail = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PaymentSettings_AspNetUsers_ProviderId",
                        column: x => x.ProviderId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PaymentTransactions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    BookingId = table.Column<int>(type: "INTEGER", nullable: false),
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    ProviderId = table.Column<string>(type: "TEXT", nullable: false),
                    Type = table.Column<int>(type: "INTEGER", nullable: false),
                    PaymentMethod = table.Column<int>(type: "INTEGER", nullable: false),
                    Amount = table.Column<decimal>(type: "TEXT", precision: 10, scale: 2, nullable: false),
                    ServiceAmount = table.Column<decimal>(type: "TEXT", precision: 10, scale: 2, nullable: false),
                    TaxAmount = table.Column<decimal>(type: "TEXT", precision: 10, scale: 2, nullable: false),
                    PlatformFeeAmount = table.Column<decimal>(type: "TEXT", precision: 10, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    StripePaymentIntentId = table.Column<string>(type: "TEXT", nullable: true),
                    StripeChargeId = table.Column<string>(type: "TEXT", nullable: true),
                    PayPalTransactionId = table.Column<string>(type: "TEXT", nullable: true),
                    ExternalTransactionId = table.Column<string>(type: "TEXT", nullable: true),
                    OriginalTransactionId = table.Column<int>(type: "INTEGER", nullable: true),
                    Description = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    FailureReason = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    ProcessedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    RefundedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PaymentTransactions_AspNetUsers_ProviderId",
                        column: x => x.ProviderId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PaymentTransactions_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PaymentTransactions_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PaymentTransactions_PaymentTransactions_OriginalTransactionId",
                        column: x => x.OriginalTransactionId,
                        principalTable: "PaymentTransactions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PaymentSettings_ProviderId",
                table: "PaymentSettings",
                column: "ProviderId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTransactions_BookingId",
                table: "PaymentTransactions",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTransactions_OriginalTransactionId",
                table: "PaymentTransactions",
                column: "OriginalTransactionId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTransactions_ProviderId",
                table: "PaymentTransactions",
                column: "ProviderId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTransactions_UserId",
                table: "PaymentTransactions",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PaymentSettings");

            migrationBuilder.DropTable(
                name: "PaymentTransactions");
        }
    }
}
