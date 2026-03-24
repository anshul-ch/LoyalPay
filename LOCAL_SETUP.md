# Local Setup (Single Credential Source)

Use only one local credentials file: `.env`

## 1) Create `.env`

```bash
cp .env.example .env
```

Set only required values in `.env`:

- `SQL_SA_PASSWORD`
- `RABBITMQ_USER`
- `RABBITMQ_PASS`
- `JWT_SECRET`

Optional values usually left as default:

- `JWT_ISSUER` (default `LoyalPay`)
- `JWT_AUDIENCE` (default `LoyalPayUsers`)
- `RABBITMQ_HOST` (default `localhost`)

## 2) Start everything

```bash
./scripts/start-local.sh
```

## 3) Stop everything

```bash
./scripts/stop-local.sh
```

## 4) Run full workflow health check

```bash
./scripts/check-workflow.sh
```

This script validates both gateway routes (for example `/signup`, `/wallet/*`, `/rewards/*`, `/admin/*`) and direct service APIs (for example `/api/profile`, `/api/wallet/balance`, `/api/rewards/summary`).

