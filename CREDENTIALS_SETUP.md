# Credentials Setup (Clean)

Use this as the single source of truth for local credentials.

## Files

- `.env.example` -> committed template with placeholders
- `.env` -> local real values (gitignored)

## First-time setup

```bash
cp .env.example .env
```

Edit `.env` and provide real values.

## Start local stack

```bash
./scripts/start-local.sh
```

## Stop local stack

```bash
./scripts/stop-local.sh
```

## Notes

- Do not create extra env files like `.env.dev` or `.new`.
- Keep only one local secret file: `.env`.
- Never commit `.env`.
