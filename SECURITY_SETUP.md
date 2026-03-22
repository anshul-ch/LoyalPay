# Local Secret Setup (Docker Compose)

To avoid committing credentials in `docker-compose.yml`, use environment variables.

## 1) Create local `.env`

Copy sample file:

```bash
cp .env.example .env
```

Update `.env` values:

```env
SQL_SA_PASSWORD=YourStrongSqlPassword
RABBITMQ_USER=your_rabbit_user
RABBITMQ_PASS=your_rabbit_password
```

## 2) Start infra

```bash
docker compose up -d
```

Compose automatically reads `.env` from repository root.

## Notes

- `.env` is ignored by git
- `.env.example` is committed as placeholder template
- Never commit real passwords
