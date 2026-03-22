# Local Credentials Setup (Clean Pattern)

This project uses a single local secret file: `.env`.

## Files and their purpose

- `.env.example` (committed): template with placeholder values only
- `.env` (local only, gitignored): your real credentials

## 1) Create your local `.env`

```bash
cp .env.example .env
```

Then edit `.env` and set real values for:

- `SQL_SA_PASSWORD`
- `RABBITMQ_USER`
- `RABBITMQ_PASS`
- `JWT_SECRET`

Keep `JWT_ISSUER` and `JWT_AUDIENCE` as defaults unless needed.

## 2) Start infrastructure

```bash
docker compose up -d
```

Docker Compose reads `.env` automatically from repo root.

## 3) Run services using same `.env`

Use one source of truth by loading env vars before `dotnet run`.

Example:

```bash
set -a
source .env
set +a
```

Then run service commands.

## Rules

- Never commit `.env`
- Never put real secrets in `appsettings.json`
- Keep only placeholders in committed config files
