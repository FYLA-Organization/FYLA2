using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FYLA2_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddSubscriptionTierAndLoyaltyProperties : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "EarnRate",
                table: "LoyaltyPrograms",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "MinimumEarn",
                table: "LoyaltyPrograms",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "MinimumRedeem",
                table: "LoyaltyPrograms",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "RewardType",
                table: "LoyaltyPrograms",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "LoyaltyPrograms",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "JoinedDate",
                table: "LoyaltyMembers",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "LastActivityDate",
                table: "LoyaltyMembers",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "TotalEarned",
                table: "LoyaltyMembers",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TotalRedeemed",
                table: "LoyaltyMembers",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "SubscriptionTier",
                table: "AspNetUsers",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EarnRate",
                table: "LoyaltyPrograms");

            migrationBuilder.DropColumn(
                name: "MinimumEarn",
                table: "LoyaltyPrograms");

            migrationBuilder.DropColumn(
                name: "MinimumRedeem",
                table: "LoyaltyPrograms");

            migrationBuilder.DropColumn(
                name: "RewardType",
                table: "LoyaltyPrograms");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "LoyaltyPrograms");

            migrationBuilder.DropColumn(
                name: "JoinedDate",
                table: "LoyaltyMembers");

            migrationBuilder.DropColumn(
                name: "LastActivityDate",
                table: "LoyaltyMembers");

            migrationBuilder.DropColumn(
                name: "TotalEarned",
                table: "LoyaltyMembers");

            migrationBuilder.DropColumn(
                name: "TotalRedeemed",
                table: "LoyaltyMembers");

            migrationBuilder.DropColumn(
                name: "SubscriptionTier",
                table: "AspNetUsers");
        }
    }
}
