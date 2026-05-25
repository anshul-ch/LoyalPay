# LoyalPay

A .NET 8 microservices backend for a digital wallet and loyalty rewards platform.
---

## Architecture

Six independent ASP.NET Core APIs + one shared library. Each service owns its own SQL Server database and communicates asynchronously via RabbitMQ.

```
backend/
├── LoyalPay.Gateway          Ocelot API gateway — single entry point (port 5000)
├── LoyalPay.AuthService      Auth, JWT, profiles, KYC documents (port 5001)
├── LoyalPay.WalletService    Balance, top-ups, transfers, statements (port 5002)
├── LoyalPay.RewardsService   Points, tiers, catalog, redemptions (port 5003)
├── LoyalPay.AdminService     Dashboard, KYC review, campaigns (port 5004)
├── LoyalPay.NotificationService Notifications inbox and event-driven alerts (port 5005)
└── LoyalPay.Shared           Shared DTOs, events, extensions
```

Each service follows Clean Architecture:

```
<Service>/
├── Domain/           Entities, domain interfaces
├── Application/      DTOs, service interfaces, service implementations
├── Infrastructure/   DbContext, EF migrations, repositories, MassTransit consumers
└── Presentation/     Controllers
```

---

## Tech Stack

| Concern | Library |
|---|---|
| Framework | .NET 8 ASP.NET Core |
| ORM | Entity Framework Core 8 + SQL Server |
| Messaging | MassTransit + RabbitMQ |
| Auth | JWT Bearer tokens + refresh token rotation |
| Gateway | Ocelot |
| PDF export | QuestPDF (Community) |
| CSV export | CsvHelper |
| API docs | Swagger / Swashbuckle |
| Config | DotNetEnv (auto-loads `.env`) |
| Password hashing | BCrypt.Net-Next |

---

## API Reference

All requests go through the Gateway on port 5000. Direct service ports are also available for development.

### Auth — `POST /api/auth/...`

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| POST | `/api/auth/signup` | No | `{ fullName, email, phone, password }` | `{ accessToken, refreshToken, userId, email, fullName, phone, role }` |
| POST | `/api/auth/login` | No | `{ email, password }` | same as signup |
| POST | `/api/auth/refresh` | No | `{ refreshToken }` | new token pair |
| POST | `/api/auth/logout` | Bearer | `{ refreshToken }` | `{ success, message }` |
| POST | `/api/auth/forgot-password` | No | `{ email }` | `{ success, message }` |

### Profile — `GET/PUT /api/profile/...`

| Method | Path | Auth | Body / Query | Returns |
|---|---|---|---|---|
| GET | `/api/profile` | Bearer | — | `{ userId, fullName, email, phone, role, kycStatus, ... }` |
| PUT | `/api/profile` | Bearer | `{ fullName, phone }` | updated profile |
| PUT | `/api/profile/password` | Bearer | `{ currentPassword, newPassword }` | `{ success, message }` |
| POST | `/api/profile/kyc` | Bearer | `{ documentType, documentNumber, fileBase64 }` | `{ success, message }` |
| GET | `/api/profile/kyc` | Bearer | — | latest submission metadata |
| GET | `/api/profile/kyc/document` | Bearer | — | raw file download |
| GET | `/api/profile/lookup` | No | `?email=` | `{ userId }` |

KYC document types: `Aadhaar` `PAN` `Passport` `DrivingLicense`

### Wallet — `/api/wallet/...`

| Method | Path | Auth | Body / Query | Returns |
|---|---|---|---|---|
| GET | `/api/wallet/balance` | Bearer | — | `{ walletId, balance, currency: "INR", updatedAt }` |
| POST | `/api/wallet/topup` | Bearer | `{ amount, paymentMethod }` | `{ topUpId, amount, status }` |
| POST | `/api/wallet/topup/{topUpId}/finish` | Bearer | `{ success: true/false }` | `{ success, message }` |
| POST | `/api/wallet/transfer` | Bearer | `{ receiverUserId, amount, note? }` | `{ success, message }` |
| GET | `/api/wallet/transactions` | Bearer | `?page=1&size=20` | `{ items, total, page, size }` |

Payment methods: `UPI` `Card` `NetBanking`

Transfer flow: call `GET /api/profile/lookup?email=` first to resolve email → userId, then call transfer.

### Statement — `/api/statement/...`

| Method | Path | Auth | Query | Returns |
|---|---|---|---|---|
| GET | `/api/statement/pdf` | Bearer | `?from=&to=` (optional, defaults last 30 days) | PDF download |
| GET | `/api/statement/csv` | Bearer | `?from=&to=` (optional, defaults last 30 days) | CSV download |

### Rewards — `/api/rewards/...`

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| GET | `/api/rewards/summary` | Bearer | — | `{ totalPoints, tier, tierProgress }` |
| GET | `/api/rewards/catalog` | No | — | `[{ itemId, name, description, itemType, pointsCost, isActive, expiresAt }]` |
| POST | `/api/rewards/redeem` | Bearer | `{ itemId }` | `{ success, message }` |
| GET | `/api/rewards/history` | Bearer | — | `[{ transactionId, transactionType, points, description, createdAt }]` |

Tiers: Silver (0–999 pts) → Gold (1000–4999 pts) → Platinum (5000+ pts)

Points earned:

- Top-up: 1 point per INR 200 + 100 first top-up bonus
- Pay/Transfer: 1 point per INR 100 (not for every transfer; low-value and probabilistic gating applied)

Catalog reward expiry:

- Rewards created include expiry (1 to 4 months based on points cost)

### Notifications — `/api/notifications/...`

| Method | Path | Auth | Body / Query | Returns |
|---|---|---|---|---|
| GET | `/api/notifications?page=1&size=20` | Bearer | pagination query | `{ items, page, size, unreadCount }` |
| POST | `/api/notifications/{notificationId}/read` | Bearer | — | `{ success, message }` |

### Admin — `/api/admin/...` (role: Admin)

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/admin/dashboard` | — | `{ totalUsers, pendingKycCount, silverCount, goldCount, platinumCount }` |
| GET | `/api/admin/users` | — | `[{ userId, fullName, email, kycStatus, isActive, balance, points, tier }]` |
| GET | `/api/admin/kyc/pending` | — | pending submissions with user info |
| GET | `/api/admin/kyc/user/{userId}` | — | all submissions for a user |
| GET | `/api/admin/kyc/{submissionId}/document` | — | raw file download |
| POST | `/api/admin/kyc/{id}/approve` | — | `{ success, message }` |
| POST | `/api/admin/kyc/{id}/reject` | `{ rejectionNote? }` | `{ success, message }` |
| POST | `/api/admin/campaigns` | `{ name, description, bonusPoints, startDate, endDate }` | campaign object |
| GET | `/api/admin/campaigns` | — | all campaigns (active + past) |
| PATCH | `/api/admin/campaigns/{campaignId}/deactivate` | — | `{ success, message }` |
| PATCH | `/api/admin/campaigns/{campaignId}/activate` | — | `{ success, message }` |
| DELETE | `/api/admin/campaigns/{campaignId}` | — | `{ success, message }` |
| POST | `/api/admin/campaigns/rewards` | `{ name, description, itemType, pointsCost, stock }` | reward object with `expiresAt` |
| GET | `/api/admin/campaigns/rewards` | — | all rewards with expiry |
| PATCH | `/api/admin/campaigns/rewards/{rewardId}/deactivate` | — | `{ success, message }` |
| PATCH | `/api/admin/campaigns/rewards/{rewardId}/activate` | — | `{ success, message }` |
| DELETE | `/api/admin/campaigns/rewards/{rewardId}` | — | `{ success, message }` |

Default admin: `admin@loyalpay.com` / `Admin@123`

---

## Async Messaging

| Event | Publisher | Consumers |
|---|---|---|
| `UserRegisteredEvent` | AuthService (on signup) | WalletService (creates wallet), RewardsService (creates reward account), NotificationService (account created alert) |
| `UserLoggedInEvent` | AuthService (on login) | NotificationService (login alert) |
| `ForgotPasswordIssuedEvent` | AuthService (on forgot-password) | NotificationService (temporary password alert) |
| `TopUpCompletedEvent` | WalletService (on finish) | RewardsService (awards points + campaign bonuses), NotificationService (top-up alert) |
| `TransferCompletedEvent` | WalletService (on transfer) | RewardsService (sender points), NotificationService (sender + receiver alerts) |
| `CashbackRedeemedEvent` | RewardsService (on cashback redemption) | WalletService (credit wallet), NotificationService (cashback alert) |
| `UserNotificationRequestedEvent` | AuthService (on change password) | NotificationService (security alert) |

---

## Standard Response Envelope

Every endpoint returns:

```json
{ "success": true,  "message": "Success", "data": { ... } }
{ "success": false, "message": "Error description" }
```

---

## Local Setup

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Git

### 1 — Clone

```bash
git clone https://github.com/anshul-ch/LoyalPay.git
cd LoyalPay
```

### 2 — Create `.env`

Copy the example and fill in your values:

```bash
cp .env.example .env
```

### 3 — Start infrastructure

```bash
docker-compose up -d
```

This starts SQL Server on port 1433 and RabbitMQ on ports 5672 / 15672. Databases and seed data are created automatically when the services first start.

### 4 — Run the services


Run manually in separate terminals:

```bash
dotnet run --project backend/LoyalPay.AuthService
dotnet run --project backend/LoyalPay.WalletService
dotnet run --project backend/LoyalPay.RewardsService
dotnet run --project backend/LoyalPay.AdminService
dotnet run --project backend/LoyalPay.NotificationService
dotnet run --project backend/LoyalPay.Gateway
```

Each service auto-migrates its database on startup — no manual `dotnet ef` commands needed.

### 5 — Verify

| Service | URL |
|---|---|
| Gateway | http://localhost:5000 |
| AuthService Swagger | http://localhost:5001/swagger |
| WalletService Swagger | http://localhost:5002/swagger |
| RewardsService Swagger | http://localhost:5003/swagger |
| AdminService Swagger | http://localhost:5004/swagger |
| NotificationService Swagger | http://localhost:5005/swagger |
| RabbitMQ Management | http://localhost:15672 |

---


## Input Validation

| Field | Rule |
|---|---|
| Full name | Required, 2–200 characters |
| Email | Required, valid email format |
| Phone | Required, exactly 10 digits |
| Password | Min 8 chars, 1 uppercase, 1 digit, 1 special character (`@$!%*?&`) |
| Document type | `Aadhaar` \| `PAN` \| `Passport` \| `DrivingLicense` |
| Payment method | `UPI` \| `Card` \| `NetBanking` |
| Top-up amount | ₹1 – ₹50,000 (daily limit ₹50,000 per wallet) |
| Transfer amount | ₹1 – ₹25,000 |
| Campaign bonus points | 1 – 100,000 |

---
