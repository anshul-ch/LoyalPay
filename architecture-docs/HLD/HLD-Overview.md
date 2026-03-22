# LoyalPay HLD Overview

## System Goal

LoyalPay is a digital wallet and loyalty platform built with .NET 8 microservices.
It supports user authentication, wallet operations, reward points, and admin operations.

## Service Boundaries

- **AuthService**: Signup, login, token refresh, logout, profile, KYC submit
- **WalletService**: Wallet creation, balance, top-up, transfer, statement
- **RewardsService**: Reward account, points earn, catalog, redemption, history
- **AdminService**: KYC review, campaign creation, dashboard, user overview
- **Gateway (Ocelot)**: Single entrypoint for routing and JWT validation
- **Shared**: Common API response and event contracts

## Infrastructure

- SQL Server for persistence (Auth DB, Wallet DB, Rewards DB)
- RabbitMQ for async event integration
- JWT for authentication and role-based authorization
- Swagger per service

## Integration Pattern

- Auth publishes `UserRegisteredEvent`
- Wallet consumes `UserRegisteredEvent` and creates wallet account
- Rewards consumes `UserRegisteredEvent` and creates reward account
- Wallet publishes `TopUpCompletedEvent`
- Rewards consumes `TopUpCompletedEvent` and awards points

## Security Model

- JWT issuer, audience and key validation with zero clock skew
- Access control by `[Authorize]`
- Admin endpoints protected by role `Admin`
- Sensitive data (password hash, raw secrets) not returned in APIs

## Data Ownership

- **Auth DB**: users, refresh tokens, kyc submissions
- **Wallet DB**: wallet accounts, ledger, top-ups, transfers, transaction disputes
- **Rewards DB**: reward accounts, transactions, point expiries, catalog, redemptions, campaigns, audit

## Non-Functional Notes

- Simple service layering: Controller -> Service -> DbContext
- Explicit and beginner-friendly code style
- Eventual consistency between services through RabbitMQ
