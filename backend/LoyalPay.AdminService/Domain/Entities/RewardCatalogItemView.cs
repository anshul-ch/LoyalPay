using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LoyalPay.AdminService.Domain.Entities;

[Table("CatalogItems")]
public class RewardCatalogItemView
{
    [Key]
    public Guid ItemId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ItemType { get; set; } = string.Empty;
    public int PointsCost { get; set; }
    public int Stock { get; set; }
    public bool IsActive { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
