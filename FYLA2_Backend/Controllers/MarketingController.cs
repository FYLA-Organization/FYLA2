using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYLA2_Backend.Data;
using FYLA2_Backend.DTOs;
using FYLA2_Backend.Models;
using System.Security.Claims;
using System.Text.Json;

namespace FYLA2_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MarketingController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MarketingController(ApplicationDbContext context)
        {
            _context = context;
        }

        private string GetCurrentUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
        }

        private async Task<bool> HasBusinessAccess()
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users.FindAsync(userId);
            
            if (user == null) return false;
            
            // Parse the subscription tier string to enum for comparison
            if (Enum.TryParse<SubscriptionTier>(user.SubscriptionTier, true, out var userTier))
            {
                return userTier >= SubscriptionTier.Business;
            }
            
            return false; // Default to no access if parsing fails
        }

        private async Task<bool> HasProAccess()
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users.FindAsync(userId);
            
            if (user == null) return false;
            
            // Parse the subscription tier string to enum for comparison
            if (Enum.TryParse<SubscriptionTier>(user.SubscriptionTier, true, out var userTier))
            {
                return userTier >= SubscriptionTier.Pro;
            }
            
            return false; // Default to no access if parsing fails
        }

        #region Campaign Management

        [HttpPost("campaigns")]
        public async Task<ActionResult<EnhancedMarketingCampaign>> CreateCampaign([FromBody] CreateCampaignDto dto)
        {
            if (!await HasBusinessAccess())
                return BadRequest("Business plan required for marketing campaigns");

            var userId = GetCurrentUserId();

            var campaign = new EnhancedMarketingCampaign
            {
                ServiceProviderId = userId,
                Name = dto.Name,
                Type = dto.Type,
                TargetAudience = dto.TargetAudience != null && dto.TargetAudience.Any() 
                    ? string.Join(",", dto.TargetAudience) 
                    : string.Empty,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Budget = dto.Budget,
                Content = JsonSerializer.Serialize(dto.Content)
            };

            _context.EnhancedMarketingCampaigns.Add(campaign);
            await _context.SaveChangesAsync();

            return Ok(campaign);
        }

        [HttpGet("campaigns")]
        public async Task<ActionResult<IEnumerable<EnhancedMarketingCampaign>>> GetCampaigns()
        {
            if (!await HasBusinessAccess())
                return BadRequest("Business plan required");            var userId = GetCurrentUserId();

            var campaigns = await _context.EnhancedMarketingCampaigns
                .Where(c => c.ServiceProviderId == userId)
                .Select(c => new CampaignSummaryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Type = c.Type,
                    Status = c.Status,
                    StartDate = c.StartDate,
                    EndDate = c.EndDate,
                    Budget = c.Budget,
                    SpentAmount = c.SpentAmount,
                    TotalSent = c.TotalSent,
                    TotalOpened = c.TotalOpened,
                    TotalClicked = c.TotalClicked,
                    TotalConverted = c.TotalConverted,
                    Revenue = c.Revenue,
                    CreatedAt = c.CreatedAt
                })
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return Ok(campaigns);
        }

        [HttpGet("campaigns/{id}")]
        public async Task<ActionResult<CampaignDetailDto>> GetCampaign(int id)
        {
            if (!await HasBusinessAccess())
                return BadRequest("Business plan required");

            var userId = GetCurrentUserId();

            var campaign = await _context.EnhancedMarketingCampaigns
                .Include(c => c.Results)
                .FirstOrDefaultAsync(c => c.Id == id && c.ServiceProviderId == userId);

            if (campaign == null)
                return NotFound();

            var dto = new CampaignDetailDto
            {
                Id = campaign.Id,
                Name = campaign.Name,
                Type = campaign.Type,
                Status = campaign.Status,
                TargetAudience = campaign.TargetAudience,
                StartDate = campaign.StartDate,
                EndDate = campaign.EndDate,
                Budget = campaign.Budget,
                SpentAmount = campaign.SpentAmount,
                Content = string.IsNullOrEmpty(campaign.Content) ? new {} : JsonSerializer.Deserialize<object>(campaign.Content),
                TotalSent = campaign.TotalSent,
                TotalOpened = campaign.TotalOpened,
                TotalClicked = campaign.TotalClicked,
                TotalConverted = campaign.TotalConverted,
                Revenue = campaign.Revenue,
                CreatedAt = campaign.CreatedAt,
                UpdatedAt = campaign.UpdatedAt
            };

            return Ok(dto);
        }

        [HttpPut("campaigns/{id}")]
        public async Task<ActionResult> UpdateCampaign(int id, [FromBody] UpdateCampaignDto dto)
        {
            if (!await HasBusinessAccess())
                return BadRequest("Business plan required");

            var userId = GetCurrentUserId();

            var campaign = await _context.EnhancedMarketingCampaigns
                .FirstOrDefaultAsync(c => c.Id == id && c.ServiceProviderId == userId);

            if (campaign == null)
                return NotFound();

            campaign.Name = dto.Name ?? campaign.Name;
            campaign.Type = dto.Type ?? campaign.Type;
            campaign.Status = dto.Status ?? campaign.Status;
            campaign.TargetAudience = dto.TargetAudience?.Count > 0 ? string.Join(",", dto.TargetAudience) : campaign.TargetAudience;
            campaign.StartDate = dto.StartDate ?? campaign.StartDate;
            campaign.EndDate = dto.EndDate ?? campaign.EndDate;
            campaign.Budget = dto.Budget;
            
            if (dto.Content != null)
                campaign.Content = JsonSerializer.Serialize(dto.Content);
            
            campaign.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok();
        }

        [HttpPost("campaigns/{id}/launch")]
        public async Task<ActionResult> LaunchCampaign(int id)
        {
            if (!await HasBusinessAccess())
                return BadRequest("Business plan required");

            var userId = GetCurrentUserId();

            var campaign = await _context.EnhancedMarketingCampaigns
                .FirstOrDefaultAsync(c => c.Id == id && c.ServiceProviderId == userId);

            if (campaign == null)
                return NotFound();

            if (campaign.Status != "draft")
                return BadRequest("Campaign must be in draft status to launch");

            campaign.Status = "active";
            campaign.UpdatedAt = DateTime.UtcNow;

            // TODO: Trigger actual campaign execution
            await ProcessCampaignLaunch(campaign);

            await _context.SaveChangesAsync();

            return Ok();
        }

        [HttpGet("campaigns/{id}/analytics")]
        public async Task<ActionResult<CampaignAnalyticsDto>> GetCampaignAnalytics(int id)
        {
            if (!await HasBusinessAccess())
                return BadRequest("Business plan required");

            var userId = GetCurrentUserId();

            var campaign = await _context.EnhancedMarketingCampaigns
                .Include(c => c.Results)
                .FirstOrDefaultAsync(c => c.Id == id && c.ServiceProviderId == userId);

            if (campaign == null)
                return NotFound();

            var analytics = new CampaignAnalyticsDto
            {
                CampaignId = campaign.Id,
                TotalSent = campaign.TotalSent,
                TotalOpened = campaign.TotalOpened,
                TotalClicked = campaign.TotalClicked,
                TotalConverted = campaign.TotalConverted,
                Revenue = campaign.Revenue,
                OpenRate = campaign.TotalSent > 0 ? (decimal)campaign.TotalOpened / campaign.TotalSent * 100 : 0,
                ClickRate = campaign.TotalOpened > 0 ? (decimal)campaign.TotalClicked / campaign.TotalOpened * 100 : 0,
                ConversionRate = campaign.TotalSent > 0 ? (decimal)campaign.TotalConverted / campaign.TotalSent * 100 : 0,
                ROI = campaign.SpentAmount > 0 ? (campaign.Revenue - campaign.SpentAmount) / campaign.SpentAmount * 100 : 0,
                CostPerConversion = campaign.TotalConverted > 0 ? campaign.SpentAmount / campaign.TotalConverted : 0,
                RevenuePerRecipient = campaign.TotalSent > 0 ? campaign.Revenue / campaign.TotalSent : 0
            };

            return Ok(analytics);
        }

        #endregion

        #region Customer Segments

        [HttpPost("segments")]
        public async Task<ActionResult<CustomerSegment>> CreateSegment([FromBody] CreateSegmentDto dto)
        {
            if (!await HasBusinessAccess())
                return BadRequest("Business plan required");

            var userId = GetCurrentUserId();

            var segment = new CustomerSegment
            {
                ServiceProviderId = userId,
                Name = dto.Name,
                Description = dto.Description,
                Criteria = JsonSerializer.Serialize(dto.Criteria)
            };

            _context.CustomerSegments.Add(segment);
            await _context.SaveChangesAsync();

            // Populate segment with matching customers
            await PopulateSegment(segment);

            return Ok(segment);
        }

        [HttpGet("segments")]
        public async Task<ActionResult<List<SegmentSummaryDto>>> GetSegments()
        {
            if (!await HasBusinessAccess())
                return BadRequest("Business plan required");

            var userId = GetCurrentUserId();

            var segments = await _context.CustomerSegments
                .Where(s => s.ServiceProviderId == userId)
                .Select(s => new SegmentSummaryDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    Description = s.Description,
                    CustomerCount = s.CustomerCount,
                    CreatedAt = s.CreatedAt
                })
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();

            return Ok(segments);
        }

        [HttpGet("segments/{id}/customers")]
        public async Task<ActionResult<List<SegmentCustomerDto>>> GetSegmentCustomers(int id)
        {
            if (!await HasBusinessAccess())
                return BadRequest("Business plan required");

            var userId = GetCurrentUserId();

            var segment = await _context.CustomerSegments
                .FirstOrDefaultAsync(s => s.Id == id && s.ServiceProviderId == userId);

            if (segment == null)
                return NotFound();

            var customers = await _context.SegmentMembers
                .Where(sm => sm.SegmentId == id)
                .Include(sm => sm.Client)
                .Select(sm => new SegmentCustomerDto
                {
                    ClientId = sm.ClientId,
                    Email = sm.Client.Email!,
                    FirstName = sm.Client.FirstName,
                    LastName = sm.Client.LastName,
                    AddedDate = sm.AddedDate
                })
                .ToListAsync();

            return Ok(customers);
        }

        #endregion

        #region Marketing Automation

        [HttpPost("automation")]
        public async Task<ActionResult<MarketingAutomation>> CreateAutomation([FromBody] CreateAutomationDto dto)
        {
            if (!await HasBusinessAccess())
                return BadRequest("Business plan required");

            var userId = GetCurrentUserId();

            var automation = new MarketingAutomation
            {
                ServiceProviderId = userId,
                Name = dto.Name,
                TriggerType = dto.TriggerType,
                ActionType = dto.ActionType,
                Content = JsonSerializer.Serialize(dto.Content),
                DelayMinutes = dto.DelayMinutes,
                IsActive = dto.IsActive
            };

            _context.MarketingAutomations.Add(automation);
            await _context.SaveChangesAsync();

            return Ok(automation);
        }

        [HttpGet("automation")]
        public async Task<ActionResult<List<AutomationSummaryDto>>> GetAutomations()
        {
            if (!await HasBusinessAccess())
                return BadRequest("Business plan required");

            var userId = GetCurrentUserId();

            var automations = await _context.MarketingAutomations
                .Where(a => a.ServiceProviderId == userId)
                .Select(a => new AutomationSummaryDto
                {
                    Id = a.Id,
                    Name = a.Name,
                    TriggerType = a.TriggerType,
                    ActionType = a.ActionType,
                    IsActive = a.IsActive,
                    TimesTriggered = a.TimesTriggered,
                    CreatedAt = a.CreatedAt
                })
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return Ok(automations);
        }

        [HttpPut("automation/{id}/toggle")]
        public async Task<ActionResult> ToggleAutomation(int id)
        {
            if (!await HasBusinessAccess())
                return BadRequest("Business plan required");

            var userId = GetCurrentUserId();

            var automation = await _context.MarketingAutomations
                .FirstOrDefaultAsync(a => a.Id == id && a.ServiceProviderId == userId);

            if (automation == null)
                return NotFound();

            automation.IsActive = !automation.IsActive;
            automation.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { IsActive = automation.IsActive });
        }

        #endregion

        #region Loyalty Programs

        [HttpPost("loyalty")]
        public async Task<ActionResult<LoyaltyProgram>> CreateLoyaltyProgram([FromBody] CreateLoyaltyProgramDto dto)
        {
            if (!await HasProAccess())
                return BadRequest("Pro plan required for loyalty programs");

            var userId = GetCurrentUserId();

            var program = new LoyaltyProgram
            {
                ServiceProviderId = userId,
                Name = dto.Name,
                Description = dto.Description,
                Type = dto.Type,
                EarnRate = dto.EarnRate,
                RedemptionValue = dto.RedemptionValue,
                MinimumEarn = dto.MinimumEarn,
                MinimumRedeem = dto.MinimumRedeem,
                RewardType = dto.RewardType
            };

            _context.LoyaltyPrograms.Add(program);
            await _context.SaveChangesAsync();

            return Ok(program);
        }

        [HttpGet("loyalty")]
        public async Task<ActionResult<List<LoyaltyProgramSummaryDto>>> GetLoyaltyPrograms()
        {
            if (!await HasProAccess())
                return BadRequest("Pro plan required for loyalty programs");

            var userId = GetCurrentUserId();

            var programs = await _context.LoyaltyPrograms
                .Where(lp => lp.ServiceProviderId == userId)
                .Select(lp => new LoyaltyProgramSummaryDto
                {
                    Id = lp.Id,
                    Name = lp.Name,
                    Type = lp.Type,
                    EarnRate = lp.EarnRate,
                    RedemptionValue = lp.RedemptionValue,
                    MemberCount = lp.Members.Count,
                    IsActive = lp.IsActive,
                    CreatedAt = lp.CreatedAt
                })
                .OrderByDescending(lp => lp.CreatedAt)
                .ToListAsync();

            return Ok(programs);
        }

        [HttpGet("loyalty/{programId}/members")]
        public async Task<ActionResult<List<LoyaltyMemberDto>>> GetLoyaltyMembers(int programId)
        {
            if (!await HasBusinessAccess())
                return BadRequest("Business plan required");

            var userId = GetCurrentUserId();

            var program = await _context.LoyaltyPrograms
                .FirstOrDefaultAsync(lp => lp.Id == programId && lp.ServiceProviderId == userId);

            if (program == null)
                return NotFound();

            var members = await _context.LoyaltyMembers
                .Where(lm => lm.LoyaltyProgramId == programId)
                .Include(lm => lm.Client)
                .Select(lm => new LoyaltyMemberDto
                {
                    Id = lm.Id,
                    ClientId = lm.ClientId,
                    ClientName = $"{lm.Client.FirstName} {lm.Client.LastName}",
                    ClientEmail = lm.Client.Email!,
                    CurrentPoints = lm.CurrentPoints,
                    TotalEarned = lm.TotalEarned,
                    TotalRedeemed = lm.TotalRedeemed,
                    JoinedDate = lm.JoinedDate,
                    LastActivityDate = lm.LastActivityDate
                })
                .OrderByDescending(lm => lm.CurrentPoints)
                .ToListAsync();

            return Ok(members);
        }

        #endregion

        #region Referral Programs

        [HttpPost("referral")]
        public async Task<ActionResult<ReferralProgram>> CreateReferralProgram([FromBody] CreateReferralProgramDto dto)
        {
            if (!await HasBusinessAccess())
                return BadRequest("Business plan required");

            var userId = GetCurrentUserId();

            var program = new ReferralProgram
            {
                ServiceProviderId = userId,
                Name = dto.Name,
                Description = dto.Description,
                ReferrerRewardType = dto.ReferrerRewardType,
                ReferrerRewardValue = dto.ReferrerRewardValue,
                RefereeRewardType = dto.RefereeRewardType,
                RefereeRewardValue = dto.RefereeRewardValue,
                MaxReferrals = dto.MaxReferrals,
                ValidityDays = dto.ValidityDays
            };

            _context.ReferralPrograms.Add(program);
            await _context.SaveChangesAsync();

            return Ok(program);
        }

        [HttpGet("referral")]
        public async Task<ActionResult<List<ReferralProgramSummaryDto>>> GetReferralPrograms()
        {
            if (!await HasBusinessAccess())
                return BadRequest("Business plan required");

            var userId = GetCurrentUserId();

            var programs = await _context.ReferralPrograms
                .Where(rp => rp.ServiceProviderId == userId)
                .Select(rp => new ReferralProgramSummaryDto
                {
                    Id = rp.Id,
                    Name = rp.Name,
                    ReferrerRewardType = rp.ReferrerRewardType,
                    ReferrerRewardValue = rp.ReferrerRewardValue,
                    RefereeRewardType = rp.RefereeRewardType,
                    RefereeRewardValue = rp.RefereeRewardValue,
                    TotalReferrals = rp.TotalReferrals,
                    TotalRewardsPaid = rp.TotalRewardsPaid,
                    IsActive = rp.IsActive,
                    CreatedAt = rp.CreatedAt
                })
                .OrderByDescending(rp => rp.CreatedAt)
                .ToListAsync();

            return Ok(programs);
        }

        [HttpPost("referral/{programId}/codes")]
        public async Task<ActionResult<ReferralCodeDto>> GenerateReferralCode(int programId, [FromBody] GenerateReferralCodeDto dto)
        {
            if (!await HasBusinessAccess())
                return BadRequest("Business plan required");

            var userId = GetCurrentUserId();

            var program = await _context.ReferralPrograms
                .FirstOrDefaultAsync(rp => rp.Id == programId && rp.ServiceProviderId == userId);

            if (program == null)
                return NotFound();

            var referralCode = GenerateUniqueReferralCode();

            var referral = new Referral
            {
                ReferralProgramId = programId,
                ReferrerId = dto.ReferrerId,
                RefereeId = string.Empty, // Will be filled when code is used
                ReferralCode = referralCode,
                Status = "pending"
            };

            _context.Referrals.Add(referral);
            await _context.SaveChangesAsync();

            return Ok(new ReferralCodeDto
            {
                ReferralCode = referralCode,
                ReferrerId = dto.ReferrerId,
                ProgramName = program.Name,
                ReferrerReward = program.ReferrerRewardValue,
                RefereeReward = program.RefereeRewardValue
            });
        }

        #endregion

        #region Promotions

        [HttpPost("promotions")]
        public async Task<ActionResult<Promotion>> CreatePromotion([FromBody] CreatePromotionDto dto)
        {
            if (!await HasProAccess())
                return BadRequest("Pro plan required for promotions");

            var userId = GetCurrentUserId();

            var promotion = new Promotion
            {
                ServiceProviderId = userId,
                Title = dto.Title,
                Description = dto.Description,
                Type = dto.Type,
                Value = dto.Value,
                PromoCode = dto.PromoCode,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                MaxUses = dto.MaxUses,
                MinimumSpend = dto.MinimumSpend,
                ApplicableServiceIds = JsonSerializer.Serialize(dto.ApplicableServiceIds),
                IsPublic = dto.IsPublic
            };

            _context.Promotions.Add(promotion);
            await _context.SaveChangesAsync();

            return Ok(promotion);
        }

        [HttpGet("promotions")]
        public async Task<ActionResult<List<PromotionSummaryDto>>> GetPromotions()
        {
            if (!await HasProAccess())
                return BadRequest("Pro plan required for promotions");

            var userId = GetCurrentUserId();

            var promotions = await _context.Promotions
                .Where(p => p.ServiceProviderId == userId)
                .Select(p => new PromotionSummaryDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    Type = p.Type,
                    Value = p.Value,
                    PromoCode = p.PromoCode,
                    StartDate = p.StartDate,
                    EndDate = p.EndDate,
                    MaxUses = p.MaxUses,
                    CurrentUses = p.CurrentUses,
                    IsActive = p.IsActive,
                    IsPublic = p.IsPublic,
                    CreatedAt = p.CreatedAt
                })
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            return Ok(promotions);
        }

        [HttpGet("promotions/public")]
        [AllowAnonymous]
        public async Task<ActionResult<List<PublicPromotionDto>>> GetPublicPromotions(string serviceProviderId)
        {
            var promotions = await _context.Promotions
                .Where(p => p.ServiceProviderId == serviceProviderId && 
                           p.IsActive && 
                           p.IsPublic && 
                           p.StartDate <= DateTime.UtcNow && 
                           p.EndDate >= DateTime.UtcNow &&
                           p.CurrentUses < p.MaxUses)
                .Select(p => new PublicPromotionDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    Description = p.Description,
                    Type = p.Type,
                    Value = p.Value,
                    PromoCode = p.PromoCode,
                    EndDate = p.EndDate,
                    MinimumSpend = p.MinimumSpend
                })
                .ToListAsync();

            return Ok(promotions);
        }

        #endregion

        #region Analytics

        [HttpGet("analytics/overview")]
        public async Task<ActionResult<MarketingOverviewDto>> GetMarketingOverview()
        {
            if (!await HasBusinessAccess())
                return BadRequest("Business plan required");

            var userId = GetCurrentUserId();

            var overview = new MarketingOverviewDto
            {
                TotalCampaigns = await _context.EnhancedMarketingCampaigns.CountAsync(c => c.ServiceProviderId == userId),
                ActiveCampaigns = await _context.EnhancedMarketingCampaigns.CountAsync(c => c.ServiceProviderId == userId && c.Status == "active"),
                TotalCustomers = await _context.Bookings.Where(b => b.Provider.Id == userId).Select(b => b.ClientId).Distinct().CountAsync(),
                TotalRevenue = await _context.EnhancedMarketingCampaigns.Where(c => c.ServiceProviderId == userId).SumAsync(c => c.Revenue),
                LoyaltyMembers = await _context.LoyaltyMembers.CountAsync(lm => lm.LoyaltyProgram.ServiceProviderId == userId),
                ActivePromotions = await _context.Promotions.CountAsync(p => p.ServiceProviderId == userId && p.IsActive),
                TotalReferrals = await _context.Referrals.CountAsync(r => r.ReferralProgram.ServiceProviderId == userId)
            };

            return Ok(overview);
        }

        #endregion

        #region Helper Methods

        private async Task ProcessCampaignLaunch(EnhancedMarketingCampaign campaign)
        {
            // TODO: Implement actual campaign processing
            // This would integrate with email services, SMS providers, etc.
            
            // For now, simulate some basic metrics
            campaign.TotalSent = 100; // Simulate sending to 100 customers
        }

        private async Task PopulateSegment(CustomerSegment segment)
        {
            // TODO: Implement segment population logic based on criteria
            // This would analyze customer data and add matching customers to the segment
            
            segment.CustomerCount = 0; // Placeholder
        }

        private string GenerateUniqueReferralCode()
        {
            return Guid.NewGuid().ToString("N")[..8].ToUpper();
        }

        #endregion
    }
}
