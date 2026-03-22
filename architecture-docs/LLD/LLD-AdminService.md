# LLD - AdminService

## Responsibilities

- Review KYC requests
- Manage campaigns
- Expose dashboard and user insights
- Enforce admin-only routes

## Main Components

- `Controllers/KycController.cs`
- `Controllers/CampaignController.cs`
- `Controllers/DashboardController.cs`
- `Services/AdminService.cs`
- `Services/SeedData.cs`
- `Data/AdminAuthDbContext.cs`
- `Data/AdminWalletDbContext.cs`
- `Data/AdminRewardsDbContext.cs`

## Endpoints

- `GET /api/admin/kyc/pending`
- `POST /api/admin/kyc/{id}/approve`
- `POST /api/admin/kyc/{id}/reject`
- `POST /api/admin/campaigns`
- `GET /api/admin/dashboard`
- `GET /api/admin/users`

## Data Model

- `UserView`, `WalletView`, `RewardView`
- `Campaign`, `AuditLog`

## Key Logic

- KYC decision updates auth user fields and writes audit log
- Dashboard combines counts from auth/wallet/rewards contexts
- Uses `Authorize(Roles = "Admin")` at controller level
