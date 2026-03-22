# LLD - RewardsService

## Responsibilities

- Create reward account on user registration event
- Add points on top-up completion event
- Serve reward summary, catalog, redeem and history

## Main Components

- `Controllers/RewardsController.cs`
- `Services/RewardsService.cs`
- `Consumers/UserRegisteredConsumer.cs`
- `Consumers/TopUpCompletedConsumer.cs`
- `Data/RewardsDbContext.cs`

## Endpoints

- `GET /api/rewards/summary`
- `GET /api/rewards/catalog`
- `POST /api/rewards/redeem`
- `GET /api/rewards/history`

## Data Model

- `RewardAccount`
- `RewardTransaction`
- `CatalogItem`
- `Redemption`

## Key Logic

- Point rule: floor(topupAmount / 100)
- First successful top-up bonus: +100 points
- Tiering: Silver (<1000), Gold (>=1000), Platinum (>=5000)
