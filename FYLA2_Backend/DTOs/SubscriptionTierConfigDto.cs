namespace FYLA2_Backend.DTOs
{
    public class SubscriptionTierConfigDto
    {
        public decimal MonthlyPrice { get; set; }
        public decimal AnnualPrice { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}
