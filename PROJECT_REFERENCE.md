# LoyalPay Project Reference Snapshot

Last updated: 2026-03-23

## What is Completed

- .NET 8 microservices implemented: Auth, Wallet, Rewards, Admin
- API Gateway migrated to Ocelot
- SQL Server + RabbitMQ infrastructure integrated
- JWT auth, role-based admin authorization, Swagger enabled
- Event flow integrated:
  - `UserRegisteredEvent` consumed by Wallet and Rewards
  - `TopUpCompletedEvent` consumed by Rewards
- EF migrations created and database updates applied
- Architecture docs and graph-ready diagrams added

## Gateway (Ocelot) Public Routes

- Auth:
  - `POST /signup`
  - `POST /login`
  - `POST /refresh`
  - `POST /logout`
  - `POST /auth/{...}` compatibility grouping
- Profile:
  - `GET /profile`
  - `POST /profile/kyc`
- Wallet:
  - `GET/POST /wallet/{...}`
  - `GET /statement/{...}`
- Rewards:
  - `GET/POST /rewards/{...}`
- Admin:
  - `GET/POST /admin/{...}`
- Backward compatibility remains:
  - `/api/auth/*`, `/api/profile/*`, `/api/wallet/*`, `/api/statement/*`, `/api/rewards/*`, `/api/admin/*`

## Main Table Count

- Auth DB: 3 tables
  - `Users`, `RefreshTokens`, `KycSubmissions`
- Wallet DB: 5 tables
  - `WalletAccounts`, `LedgerEntries`, `TopUpRequests`, `TransferRequests`, `TransactionDisputes`
- Rewards DB: 7 tables
  - `RewardAccounts`, `RewardTransactions`, `PointExpiries`, `CatalogItems`, `Redemptions`, `Campaigns`, `AuditLogs`
- Total main tables: 15

## Key Paths

- Solution: `backend/LoyalPay.slnx`
- Ocelot config: `backend/LoyalPay.Gateway/ocelot.json`
- Gateway runtime: `backend/LoyalPay.Gateway/Program.cs`
- Architecture docs: `architecture-docs/`

## Deployment/Runtime Notes

- Keep `appsettings.json` placeholder values in git (`CHANGE_ME`/placeholder style)
- Real values come from runtime environment variables
- SQL Server container port: `1433`
- RabbitMQ ports: `5672`, `15672`

## Quick Health Checks

- Build: `dotnet build backend/LoyalPay.slnx`
- Container status: `docker ps`
- Gateway port check: `ss -ltnp | rg '5000'`
- Example auth check:
  - `POST http://localhost:5000/signup`
  - `POST http://localhost:5000/login`

## Documentation Pack

- `architecture-docs/HLD/`
- `architecture-docs/LLD/`
- `architecture-docs/Diagrams/`
- `architecture-docs/Database/`
