using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FYLA2_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddSeatRentalBookingToBookings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ClientId",
                table: "LoyaltyTransactions",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "LoyaltyMemberId",
                table: "LoyaltyTransactions",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LoyaltyProgramId",
                table: "LoyaltyTransactions",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SeatRentalBookingId",
                table: "Bookings",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "BrandProfiles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ServiceProviderId = table.Column<string>(type: "TEXT", nullable: false),
                    BusinessName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    LogoUrl = table.Column<string>(type: "TEXT", nullable: true),
                    PrimaryColor = table.Column<string>(type: "TEXT", maxLength: 7, nullable: false),
                    SecondaryColor = table.Column<string>(type: "TEXT", maxLength: 7, nullable: false),
                    AccentColor = table.Column<string>(type: "TEXT", maxLength: 7, nullable: false),
                    FontFamily = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Tagline = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    WebsiteUrl = table.Column<string>(type: "TEXT", nullable: true),
                    InstagramHandle = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    FacebookPage = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    TwitterHandle = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BrandProfiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BrandProfiles_AspNetUsers_ServiceProviderId",
                        column: x => x.ServiceProviderId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CustomerSegments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ServiceProviderId = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    Criteria = table.Column<string>(type: "TEXT", nullable: false),
                    CustomerCount = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomerSegments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CustomerSegments_AspNetUsers_ServiceProviderId",
                        column: x => x.ServiceProviderId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EnhancedMarketingCampaigns",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ServiceProviderId = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Type = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    TargetAudience = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    StartDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    EndDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Budget = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    SpentAmount = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    Content = table.Column<string>(type: "TEXT", nullable: false),
                    TotalSent = table.Column<int>(type: "INTEGER", nullable: false),
                    TotalOpened = table.Column<int>(type: "INTEGER", nullable: false),
                    TotalClicked = table.Column<int>(type: "INTEGER", nullable: false),
                    TotalConverted = table.Column<int>(type: "INTEGER", nullable: false),
                    Revenue = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EnhancedMarketingCampaigns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EnhancedMarketingCampaigns_AspNetUsers_ServiceProviderId",
                        column: x => x.ServiceProviderId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LoyaltyPrograms",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ServiceProviderId = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    PointsPerDollar = table.Column<int>(type: "INTEGER", nullable: false),
                    MinimumRedemption = table.Column<int>(type: "INTEGER", nullable: false),
                    RedemptionValue = table.Column<decimal>(type: "TEXT", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoyaltyPrograms", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LoyaltyPrograms_AspNetUsers_ServiceProviderId",
                        column: x => x.ServiceProviderId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MarketingAutomations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ServiceProviderId = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    TriggerType = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    ActionType = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Content = table.Column<string>(type: "TEXT", nullable: false),
                    DelayMinutes = table.Column<int>(type: "INTEGER", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    TimesTriggered = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarketingAutomations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MarketingAutomations_AspNetUsers_ServiceProviderId",
                        column: x => x.ServiceProviderId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Promotions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ServiceProviderId = table.Column<string>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    Type = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Value = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    PromoCode = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    StartDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    EndDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    MaxUses = table.Column<int>(type: "INTEGER", nullable: false),
                    CurrentUses = table.Column<int>(type: "INTEGER", nullable: false),
                    MinimumSpend = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    ApplicableServiceIds = table.Column<string>(type: "TEXT", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsPublic = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Promotions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Promotions_AspNetUsers_ServiceProviderId",
                        column: x => x.ServiceProviderId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ReferralPrograms",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ServiceProviderId = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    ReferrerRewardType = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    ReferrerRewardValue = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    RefereeRewardType = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    RefereeRewardValue = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    MaxReferrals = table.Column<int>(type: "INTEGER", nullable: false),
                    ValidityDays = table.Column<int>(type: "INTEGER", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    TotalReferrals = table.Column<int>(type: "INTEGER", nullable: false),
                    TotalRewardsPaid = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReferralPrograms", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReferralPrograms_AspNetUsers_ServiceProviderId",
                        column: x => x.ServiceProviderId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SeatRentals",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    OwnerId = table.Column<string>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    Address = table.Column<string>(type: "TEXT", nullable: false),
                    City = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    State = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    ZipCode = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    DailyRate = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    WeeklyRate = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    MonthlyRate = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    CommissionRate = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    Amenities = table.Column<string>(type: "TEXT", nullable: false),
                    AvailableHours = table.Column<string>(type: "TEXT", nullable: false),
                    Photos = table.Column<string>(type: "TEXT", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    RequiresApproval = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SeatRentals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SeatRentals_AspNetUsers_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BrandedEmailTemplates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    BrandProfileId = table.Column<int>(type: "INTEGER", nullable: false),
                    TemplateType = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Subject = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    HtmlContent = table.Column<string>(type: "TEXT", nullable: false),
                    TextContent = table.Column<string>(type: "TEXT", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BrandedEmailTemplates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BrandedEmailTemplates_BrandProfiles_BrandProfileId",
                        column: x => x.BrandProfileId,
                        principalTable: "BrandProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SegmentMembers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    SegmentId = table.Column<int>(type: "INTEGER", nullable: false),
                    ClientId = table.Column<string>(type: "TEXT", nullable: false),
                    AddedDate = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SegmentMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SegmentMembers_AspNetUsers_ClientId",
                        column: x => x.ClientId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SegmentMembers_CustomerSegments_SegmentId",
                        column: x => x.SegmentId,
                        principalTable: "CustomerSegments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CampaignResults",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CampaignId = table.Column<int>(type: "INTEGER", nullable: false),
                    ClientId = table.Column<string>(type: "TEXT", nullable: false),
                    Action = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    ActionDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    RevenueGenerated = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    Metadata = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CampaignResults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CampaignResults_AspNetUsers_ClientId",
                        column: x => x.ClientId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CampaignResults_EnhancedMarketingCampaigns_CampaignId",
                        column: x => x.CampaignId,
                        principalTable: "EnhancedMarketingCampaigns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LoyaltyMembers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ClientId = table.Column<string>(type: "TEXT", nullable: false),
                    LoyaltyProgramId = table.Column<int>(type: "INTEGER", nullable: false),
                    CurrentPoints = table.Column<int>(type: "INTEGER", nullable: false),
                    TotalPointsEarned = table.Column<int>(type: "INTEGER", nullable: false),
                    TotalPointsRedeemed = table.Column<int>(type: "INTEGER", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    LastActivity = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoyaltyMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LoyaltyMembers_AspNetUsers_ClientId",
                        column: x => x.ClientId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LoyaltyMembers_LoyaltyPrograms_LoyaltyProgramId",
                        column: x => x.LoyaltyProgramId,
                        principalTable: "LoyaltyPrograms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AutomationExecutions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    AutomationId = table.Column<int>(type: "INTEGER", nullable: false),
                    ClientId = table.Column<string>(type: "TEXT", nullable: false),
                    TriggerEvent = table.Column<string>(type: "TEXT", nullable: false),
                    ScheduledFor = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ExecutedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    ErrorMessage = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AutomationExecutions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AutomationExecutions_AspNetUsers_ClientId",
                        column: x => x.ClientId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AutomationExecutions_MarketingAutomations_AutomationId",
                        column: x => x.AutomationId,
                        principalTable: "MarketingAutomations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PromotionUsages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PromotionId = table.Column<int>(type: "INTEGER", nullable: false),
                    ClientId = table.Column<string>(type: "TEXT", nullable: false),
                    BookingId = table.Column<int>(type: "INTEGER", nullable: false),
                    DiscountAmount = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    UsedDate = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PromotionUsages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PromotionUsages_AspNetUsers_ClientId",
                        column: x => x.ClientId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PromotionUsages_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PromotionUsages_Promotions_PromotionId",
                        column: x => x.PromotionId,
                        principalTable: "Promotions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Referrals",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ReferralProgramId = table.Column<int>(type: "INTEGER", nullable: false),
                    ReferrerId = table.Column<string>(type: "TEXT", nullable: false),
                    RefereeId = table.Column<string>(type: "TEXT", nullable: false),
                    ReferralCode = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    ReferralDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CompletionDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    RewardDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ReferrerReward = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    RefereeReward = table.Column<decimal>(type: "decimal(10,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Referrals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Referrals_AspNetUsers_RefereeId",
                        column: x => x.RefereeId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Referrals_AspNetUsers_ReferrerId",
                        column: x => x.ReferrerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Referrals_ReferralPrograms_ReferralProgramId",
                        column: x => x.ReferralProgramId,
                        principalTable: "ReferralPrograms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SeatRentalBookings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    SeatRentalId = table.Column<int>(type: "INTEGER", nullable: false),
                    RenterId = table.Column<string>(type: "TEXT", nullable: false),
                    StartDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    EndDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    CommissionAmount = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    Notes = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SeatRentalBookings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SeatRentalBookings_AspNetUsers_RenterId",
                        column: x => x.RenterId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SeatRentalBookings_SeatRentals_SeatRentalId",
                        column: x => x.SeatRentalId,
                        principalTable: "SeatRentals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LoyaltyTransactions_LoyaltyMemberId",
                table: "LoyaltyTransactions",
                column: "LoyaltyMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_LoyaltyTransactions_LoyaltyProgramId",
                table: "LoyaltyTransactions",
                column: "LoyaltyProgramId");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_SeatRentalBookingId",
                table: "Bookings",
                column: "SeatRentalBookingId");

            migrationBuilder.CreateIndex(
                name: "IX_AutomationExecutions_AutomationId",
                table: "AutomationExecutions",
                column: "AutomationId");

            migrationBuilder.CreateIndex(
                name: "IX_AutomationExecutions_ClientId",
                table: "AutomationExecutions",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_BrandedEmailTemplates_BrandProfileId",
                table: "BrandedEmailTemplates",
                column: "BrandProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_BrandProfiles_ServiceProviderId",
                table: "BrandProfiles",
                column: "ServiceProviderId");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignResults_CampaignId",
                table: "CampaignResults",
                column: "CampaignId");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignResults_ClientId",
                table: "CampaignResults",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerSegments_ServiceProviderId",
                table: "CustomerSegments",
                column: "ServiceProviderId");

            migrationBuilder.CreateIndex(
                name: "IX_EnhancedMarketingCampaigns_ServiceProviderId",
                table: "EnhancedMarketingCampaigns",
                column: "ServiceProviderId");

            migrationBuilder.CreateIndex(
                name: "IX_LoyaltyMembers_ClientId",
                table: "LoyaltyMembers",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_LoyaltyMembers_LoyaltyProgramId",
                table: "LoyaltyMembers",
                column: "LoyaltyProgramId");

            migrationBuilder.CreateIndex(
                name: "IX_LoyaltyPrograms_ServiceProviderId",
                table: "LoyaltyPrograms",
                column: "ServiceProviderId");

            migrationBuilder.CreateIndex(
                name: "IX_MarketingAutomations_ServiceProviderId",
                table: "MarketingAutomations",
                column: "ServiceProviderId");

            migrationBuilder.CreateIndex(
                name: "IX_Promotions_ServiceProviderId",
                table: "Promotions",
                column: "ServiceProviderId");

            migrationBuilder.CreateIndex(
                name: "IX_PromotionUsages_BookingId",
                table: "PromotionUsages",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_PromotionUsages_ClientId",
                table: "PromotionUsages",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_PromotionUsages_PromotionId",
                table: "PromotionUsages",
                column: "PromotionId");

            migrationBuilder.CreateIndex(
                name: "IX_ReferralPrograms_ServiceProviderId",
                table: "ReferralPrograms",
                column: "ServiceProviderId");

            migrationBuilder.CreateIndex(
                name: "IX_Referrals_RefereeId",
                table: "Referrals",
                column: "RefereeId");

            migrationBuilder.CreateIndex(
                name: "IX_Referrals_ReferralProgramId",
                table: "Referrals",
                column: "ReferralProgramId");

            migrationBuilder.CreateIndex(
                name: "IX_Referrals_ReferrerId",
                table: "Referrals",
                column: "ReferrerId");

            migrationBuilder.CreateIndex(
                name: "IX_SeatRentalBookings_RenterId",
                table: "SeatRentalBookings",
                column: "RenterId");

            migrationBuilder.CreateIndex(
                name: "IX_SeatRentalBookings_SeatRentalId",
                table: "SeatRentalBookings",
                column: "SeatRentalId");

            migrationBuilder.CreateIndex(
                name: "IX_SeatRentals_OwnerId",
                table: "SeatRentals",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_SegmentMembers_ClientId",
                table: "SegmentMembers",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_SegmentMembers_SegmentId",
                table: "SegmentMembers",
                column: "SegmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_SeatRentalBookings_SeatRentalBookingId",
                table: "Bookings",
                column: "SeatRentalBookingId",
                principalTable: "SeatRentalBookings",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_LoyaltyTransactions_LoyaltyMembers_LoyaltyMemberId",
                table: "LoyaltyTransactions",
                column: "LoyaltyMemberId",
                principalTable: "LoyaltyMembers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_LoyaltyTransactions_LoyaltyPrograms_LoyaltyProgramId",
                table: "LoyaltyTransactions",
                column: "LoyaltyProgramId",
                principalTable: "LoyaltyPrograms",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_SeatRentalBookings_SeatRentalBookingId",
                table: "Bookings");

            migrationBuilder.DropForeignKey(
                name: "FK_LoyaltyTransactions_LoyaltyMembers_LoyaltyMemberId",
                table: "LoyaltyTransactions");

            migrationBuilder.DropForeignKey(
                name: "FK_LoyaltyTransactions_LoyaltyPrograms_LoyaltyProgramId",
                table: "LoyaltyTransactions");

            migrationBuilder.DropTable(
                name: "AutomationExecutions");

            migrationBuilder.DropTable(
                name: "BrandedEmailTemplates");

            migrationBuilder.DropTable(
                name: "CampaignResults");

            migrationBuilder.DropTable(
                name: "LoyaltyMembers");

            migrationBuilder.DropTable(
                name: "PromotionUsages");

            migrationBuilder.DropTable(
                name: "Referrals");

            migrationBuilder.DropTable(
                name: "SeatRentalBookings");

            migrationBuilder.DropTable(
                name: "SegmentMembers");

            migrationBuilder.DropTable(
                name: "MarketingAutomations");

            migrationBuilder.DropTable(
                name: "BrandProfiles");

            migrationBuilder.DropTable(
                name: "EnhancedMarketingCampaigns");

            migrationBuilder.DropTable(
                name: "LoyaltyPrograms");

            migrationBuilder.DropTable(
                name: "Promotions");

            migrationBuilder.DropTable(
                name: "ReferralPrograms");

            migrationBuilder.DropTable(
                name: "SeatRentals");

            migrationBuilder.DropTable(
                name: "CustomerSegments");

            migrationBuilder.DropIndex(
                name: "IX_LoyaltyTransactions_LoyaltyMemberId",
                table: "LoyaltyTransactions");

            migrationBuilder.DropIndex(
                name: "IX_LoyaltyTransactions_LoyaltyProgramId",
                table: "LoyaltyTransactions");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_SeatRentalBookingId",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "ClientId",
                table: "LoyaltyTransactions");

            migrationBuilder.DropColumn(
                name: "LoyaltyMemberId",
                table: "LoyaltyTransactions");

            migrationBuilder.DropColumn(
                name: "LoyaltyProgramId",
                table: "LoyaltyTransactions");

            migrationBuilder.DropColumn(
                name: "SeatRentalBookingId",
                table: "Bookings");
        }
    }
}
