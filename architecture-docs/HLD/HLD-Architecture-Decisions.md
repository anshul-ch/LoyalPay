# LoyalPay Architecture Decisions

## ADR-01: Microservice Split by Business Capability

- **Decision**: Separate Auth, Wallet, Rewards, Admin and Gateway into independent projects.
- **Reason**: Clear ownership and easier iterative development.

## ADR-02: Ocelot as API Gateway

- **Decision**: Use Ocelot for route-based reverse proxy.
- **Reason**: Clean route file (`ocelot.json`) and easy short public URL mapping.

## ADR-03: RabbitMQ for Event Integration

- **Decision**: Use publish/consume with MassTransit + RabbitMQ.
- **Reason**: Decouples user onboarding and reward computation from synchronous APIs.

## ADR-04: SQL Server with EF Core Migrations

- **Decision**: Use EF Core code-first models and migrations.
- **Reason**: Keeps schema aligned with simple C# model changes.

## ADR-05: JWT-based AuthN/AuthZ

- **Decision**: Validate issuer, audience and signing key in each service and gateway.
- **Reason**: Service-level protection and gateway-level protection.

## ADR-06: Simple Layering

- **Decision**: No repository pattern, keep `Controller -> Service -> DbContext`.
- **Reason**: Beginner-friendly structure and low complexity.
