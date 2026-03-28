# LoyalPay

LoyalPay is a backend project built using .NET microservices. It was created as a college project to learn how microservices work in practice. The project handles user authentication, a digital wallet, a rewards and loyalty system, and an admin panel.

---

## Project Structure

The backend is split into five separate APIs and one shared library. Each API runs independently and has its own database.

```
backend/
    LoyalPay.AuthService        User registration, login, JWT tokens, KYC
    LoyalPay.WalletService      Wallet balance, top-ups, transfers, statements
    LoyalPay.RewardsService     Points, tiers, catalog, redemptions
    LoyalPay.AdminService       Admin dashboard, KYC review, campaigns
    LoyalPay.Gateway            Ocelot API gateway (single entry point)
    LoyalPay.Shared             Shared DTOs, events, and extension methods
```

---

## Technologies Used

- .NET 8 (ASP.NET Core Web API)
- Entity Framework Core with SQL Server
- MassTransit with RabbitMQ (for messaging between services)
- JWT (JSON Web Tokens) for authentication
- Ocelot (API Gateway)
- QuestPDF (PDF statement generation)
- CsvHelper (CSV statement export)
- Swagger (API documentation and testing)
- DotNetEnv (automatic .env file loading)

---

## Services and What They Do

### AuthService (Port 5001)

- POST /api/auth/signup - Register a new user
- POST /api/auth/login - Login and get a JWT token
- POST /api/auth/refresh - Get a new token using a refresh token
- POST /api/auth/logout - Revoke a refresh token
- GET  /api/profile - Get logged in user profile
- POST /api/profile/kyc - Submit KYC documents

### WalletService (Port 5002)

- GET  /api/wallet/balance - Check wallet balance
- POST /api/wallet/topup - Start a top-up request
- POST /api/wallet/topup/{id}/finish - Confirm or cancel a top-up
- POST /api/wallet/transfer - Transfer money to another user
- GET  /api/wallet/transactions - View transaction history
- GET  /api/statement/pdf - Download PDF statement
- GET  /api/statement/csv - Download CSV statement

### RewardsService (Port 5003)

- GET  /api/rewards/summary - View total points and current tier
- GET  /api/rewards/history - View points earned and spent
- GET  /api/rewards/catalog - View available reward items
- POST /api/rewards/redeem - Redeem points for a catalog item

### AdminService (Port 5004)

Admin-only endpoints. Requires a JWT token with the Admin role.

- GET  /api/admin/dashboard - Summary of all users, wallets, and points
- GET  /api/admin/users - List of all users
- GET  /api/admin/kyc/pending - List of users with pending KYC
- POST /api/admin/kyc/{id}/approve - Approve a KYC submission
- POST /api/admin/kyc/{id}/reject - Reject a KYC submission
- POST /api/admin/campaigns - Create a bonus points campaign

### Gateway (Port 5000)

All frontend requests go through this gateway. It routes them to the correct backend service using Ocelot.

---

## How Services Communicate

When certain events happen, services publish messages to RabbitMQ. Other services listen for these messages and react.

- When a user registers, WalletService and RewardsService automatically create accounts for them.
- When a top-up is completed, RewardsService adds the corresponding points to the user.
- If a campaign is active at the time of a top-up, bonus points are also added automatically.

---

## Points and Tiers

Points are earned automatically on every successful top-up.

- 1 point for every 100 rupees topped up
- 100 bonus points on the first top-up
- Additional bonus points if an active campaign is running during the top-up

Tier levels:

| Tier     | Points Required |
|----------|----------------|
| Silver   | 0 and above    |
| Gold     | 1000 and above |
| Platinum | 5000 and above |

---

## Setup Instructions

### Requirements

- .NET 8 SDK
- Docker Desktop
- Git

### Step 1: Clone the repository

```
git clone https://github.com/anshul-ch/LoyalPay.git
cd LoyalPay
```

### Step 2: Create the .env file

Create a file called `.env` in the root of the project. This file holds all your configuration. Do not commit this file to Git.

```
SA_PASSWORD=YourSqlPassword

AUTH_DB=Server=localhost,1433;Database=LoyalPayAuthDb;User Id=sa;Password=YourSqlPassword;TrustServerCertificate=true;
WALLET_DB=Server=localhost,1433;Database=LoyalPayWalletDb;User Id=sa;Password=YourSqlPassword;TrustServerCertificate=true;
REWARDS_DB=Server=localhost,1433;Database=LoyalPayRewardsDb;User Id=sa;Password=YourSqlPassword;TrustServerCertificate=true;

JWT_SECRET=YourSecretKeyMustBeAtLeast32CharactersLong
JWT_ISSUER=LoyalPay
JWT_AUDIENCE=LoyalPayUsers

RABBITMQ_HOST=localhost
RABBITMQ_USER=your_rabbitmq_username
RABBITMQ_PASS=your_rabbitmq_password
```

Replace all values starting with `Your` with your actual values. The SQL password must meet SQL Server complexity requirements.

### Step 3: Start the infrastructure

This starts SQL Server and RabbitMQ using Docker.

```
docker-compose up -d
```

### Step 4: Run database migrations

Run these commands from the root of the project. Each service has its own database.

```
dotnet ef database update --project backend/LoyalPay.AuthService
dotnet ef database update --project backend/LoyalPay.WalletService
dotnet ef database update --project backend/LoyalPay.RewardsService
dotnet ef database update --context AdminRewardsDbContext --project backend/LoyalPay.AdminService
```

Note: The migrations will read connection strings from your `.env` file automatically.

### Step 5: Run the services

Open five separate terminal windows and run one command in each. The services read all configuration from the `.env` file automatically.

```
dotnet run --project backend/LoyalPay.AuthService
```

```
dotnet run --project backend/LoyalPay.WalletService
```

```
dotnet run --project backend/LoyalPay.RewardsService
```

```
dotnet run --project backend/LoyalPay.AdminService
```

```
dotnet run --project backend/LoyalPay.Gateway
```

---

## Swagger UI

After starting the services, you can test the APIs at the following addresses.

| Service        | URL                           |
|----------------|-------------------------------|
| AuthService    | http://localhost:5001/swagger |
| WalletService  | http://localhost:5002/swagger |
| RewardsService | http://localhost:5003/swagger |
| AdminService   | http://localhost:5004/swagger |
| RabbitMQ UI    | http://localhost:15672        |

Default admin account (created automatically on first run):

- Email: admin@loyalpay.com
- Password: Admin@123


---

## Input Validation

All user inputs are validated before they reach the database.

| Field           | Rule                                                              |
|-----------------|-------------------------------------------------------------------|
| Full Name       | Required, minimum 2 characters                                    |
| Email           | Required, must be a valid email format                            |
| Phone           | Required, exactly 10 digits                                       |
| Password        | Minimum 8 characters, 1 uppercase, 1 number, 1 special character |
| Document Type   | Must be: Aadhaar, PAN, Passport, or DrivingLicense                |
| Payment Method  | Must be: UPI, Card, or NetBanking                                 |
| Top-up Amount   | Between 1 and 50,000                                              |
| Transfer Amount | Between 1 and 25,000                                              |
| Campaign Points | Between 1 and 100,000                                             |

---
