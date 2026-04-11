using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LoyalPay.RewardsService.Models;

[Table("CatalogItems")]
public class CatalogItem
{
    [Key]
    public Guid ItemId { get; set; }

    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(50)]
    public string ItemType { get; set; } = string.Empty;

    public int PointsCost { get; set; }

    public int Stock { get; set; } = -1;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; }
}
