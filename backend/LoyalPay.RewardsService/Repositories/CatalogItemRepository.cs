using LoyalPay.RewardsService.Data;
using LoyalPay.RewardsService.Models;
using Microsoft.EntityFrameworkCore;

namespace LoyalPay.RewardsService.Repositories;

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