using LoyalPay.RewardsService.Models;

namespace LoyalPay.RewardsService.Repositories;

public interface ICatalogItemRepository
{
    Task<List<CatalogItem>> GetAllCatalogItemsAsync();
    Task<CatalogItem?> GetCatalogItemByIdAsync(Guid catalogId);
    Task AddCatalogItemAsync(CatalogItem catalogItem);
    Task UpdateCatalogItemAsync(CatalogItem catalogItem);
    Task SaveChangesAsync();
}