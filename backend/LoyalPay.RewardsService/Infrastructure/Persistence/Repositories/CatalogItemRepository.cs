using LoyalPay.RewardsService.Domain.Entities;
using LoyalPay.RewardsService.Domain.Interfaces;
using LoyalPay.RewardsService.Infrastructure.Persistence.DbContext;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.RewardsService.Infrastructure.Persistence.Repositories;

public class CatalogItemRepository : ICatalogItemRepository
{
    private readonly RewardsDbContext _db;

    public CatalogItemRepository(RewardsDbContext db)
    {
        _db = db;
    }

    public async Task<List<CatalogItem>> GetAllCatalogItemsAsync()
    {
        return await _db.CatalogItems.ToListAsync();
    }

    public async Task<CatalogItem?> GetCatalogItemByIdAsync(Guid catalogId)
    {
        return await _db.CatalogItems.FindAsync(catalogId);
    }

    public async Task<List<CatalogItem>> GetExpiredCatalogItemsAsync(DateTime nowUtc)
    {
        return await _db.CatalogItems
            .Where(c => c.ExpiresAt != null && c.ExpiresAt <= nowUtc)
            .ToListAsync();
    }

    public async Task RemoveCatalogItemsAsync(List<CatalogItem> items)
    {
        _db.CatalogItems.RemoveRange(items);
        await Task.CompletedTask;
    }

    public async Task AddCatalogItemAsync(CatalogItem catalogItem)
    {
        _db.CatalogItems.Add(catalogItem);
    }

    public async Task UpdateCatalogItemAsync(CatalogItem catalogItem)
    {
        _db.CatalogItems.Update(catalogItem);
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}
