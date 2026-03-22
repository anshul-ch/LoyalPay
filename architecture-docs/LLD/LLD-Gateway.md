# LLD - API Gateway (Ocelot)

## Responsibilities

- Accept all client traffic on single host
- Validate JWT token at edge
- Forward to downstream microservices by route

## Route Mapping

- Short public routes:
  - `/signup`, `/login`, `/refresh`, `/logout`
  - `/profile`, `/profile/kyc`
  - `/wallet/*`, `/statement/*`, `/rewards/*`, `/admin/*`
- Backward-compatible routes:
  - `/api/auth/*`, `/api/profile/*`, `/api/wallet/*`, `/api/statement/*`, `/api/rewards/*`, `/api/admin/*`

## Components

- `Program.cs`: JWT + Ocelot + CORS
- `ocelot.json`: route templates and downstream mapping
- `appsettings.json`: JWT/logging/base settings

## Security

- JWT validation enabled before proxy forwarding
- Same issuer/audience/key policy as backend services
