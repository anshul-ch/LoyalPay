using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LoyalPay.AdminService.Models;

[Table("Campaigns")]
public class Campaign
{
    [Key]
    public Guid CampaignId { get; set; }

    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public int BonusPoints { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; }
}
