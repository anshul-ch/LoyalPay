namespace LoyalPay.RewardsService.Application.DTOs;

public class CatalogItemDto
{
    public Guid ItemId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ItemType { get; set; } = string.Empty;
    public int PointsCost { get; set; }
    public bool IsActive { get; set; }
}
