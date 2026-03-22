# LLD - WalletService

## Responsibilities

- Create wallet account on user registration event
- Provide balance and transactions
- Manage top-up lifecycle and transfer
- Generate statement PDF/CSV
- Publish `TopUpCompletedEvent`

## Main Components

- `Controllers/WalletController.cs`
- `Controllers/StatementController.cs`
- `Services/WalletService.cs`
- `Services/StatementService.cs`
- `Consumers/UserRegisteredConsumer.cs`
- `Data/WalletDbContext.cs`

## Endpoints

- `GET /api/wallet/balance`
- `POST /api/wallet/topup`
- `POST /api/wallet/topup/{id}/finish`
- `POST /api/wallet/transfer`
- `GET /api/wallet/transactions`
- `GET /api/statement/pdf`
- `GET /api/statement/csv`

## Data Model

- `WalletAccount`
- `LedgerEntry`
- `TopUpRequest`
- `TransferRequest`

## Key Logic

- Daily top-up limit: INR 50,000
- Daily transfer limit: INR 25,000
- Finish top-up in DB transaction and then publish event
