using LoyalPay.RewardsService.Domain.Entities;

namespace LoyalPay.RewardsService.Domain.Interfaces;

public interface ICatalogItemRepository
{
    Task<List<CatalogItem>> GetAllCatalogItemsAsync();
    Task<CatalogItem?> GetCatalogItemByIdAsync(Guid catalogId);
    Task<List<CatalogItem>> GetExpiredCatalogItemsAsync(DateTime nowUtc);
    Task RemoveCatalogItemsAsync(List<CatalogItem> items);
    Task AddCatalogItemAsync(CatalogItem catalogItem);
    Task UpdateCatalogItemAsync(CatalogItem catalogItem);
    Task SaveChangesAsync();
}
