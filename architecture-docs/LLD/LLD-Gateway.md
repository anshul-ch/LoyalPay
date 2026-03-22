# LLD - API Gateway (YARP)

## Responsibilities

- Accept all client traffic on single host
- Validate JWT token at edge
- Forward to downstream microservices by route

## Route Mapping

- `/api/auth/*` -> AuthService
- `/api/profile/*` -> AuthService
- `/api/wallet/*` -> WalletService
- `/api/statement/*` -> WalletService
- `/api/rewards/*` -> RewardsService
- `/api/admin/*` -> AdminService

## Components

- `Program.cs`: JWT + YARP + CORS
- `appsettings.json`: reverse proxy route/cluster map

## Security

- JWT validation enabled before proxy forwarding
- Same issuer/audience/key policy as backend services
