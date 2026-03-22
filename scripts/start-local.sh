#!/usr/bin/env bash
set -e

if [ ! -f ".env" ]; then
  echo "Missing .env file. Copy .env.example to .env and set values first."
  exit 1
fi

set -a
source .env
set +a

docker compose up -d

pkill -f "LoyalPay\\.AuthService|LoyalPay\\.WalletService|LoyalPay\\.RewardsService|LoyalPay\\.AdminService|LoyalPay\\.Gateway|dotnet .*LoyalPay.Gateway" || true

nohup env AUTH_DB="$AUTH_DB" JWT_SECRET="$JWT_SECRET" JWT_ISSUER="$JWT_ISSUER" JWT_AUDIENCE="$JWT_AUDIENCE" RABBITMQ_HOST="$RABBITMQ_HOST" RABBITMQ_USER="$RABBITMQ_USER" RABBITMQ_PASS="$RABBITMQ_PASS" dotnet run --urls http://localhost:5001 > /tmp/loyalpay-auth.log 2>&1 &
nohup env WALLET_DB="$WALLET_DB" JWT_SECRET="$JWT_SECRET" JWT_ISSUER="$JWT_ISSUER" JWT_AUDIENCE="$JWT_AUDIENCE" RABBITMQ_HOST="$RABBITMQ_HOST" RABBITMQ_USER="$RABBITMQ_USER" RABBITMQ_PASS="$RABBITMQ_PASS" dotnet run --urls http://localhost:5002 > /tmp/loyalpay-wallet.log 2>&1 &
nohup env REWARDS_DB="$REWARDS_DB" JWT_SECRET="$JWT_SECRET" JWT_ISSUER="$JWT_ISSUER" JWT_AUDIENCE="$JWT_AUDIENCE" RABBITMQ_HOST="$RABBITMQ_HOST" RABBITMQ_USER="$RABBITMQ_USER" RABBITMQ_PASS="$RABBITMQ_PASS" dotnet run --urls http://localhost:5003 > /tmp/loyalpay-rewards.log 2>&1 &
nohup env AUTH_DB="$AUTH_DB" WALLET_DB="$WALLET_DB" REWARDS_DB="$REWARDS_DB" JWT_SECRET="$JWT_SECRET" JWT_ISSUER="$JWT_ISSUER" JWT_AUDIENCE="$JWT_AUDIENCE" RABBITMQ_HOST="$RABBITMQ_HOST" RABBITMQ_USER="$RABBITMQ_USER" RABBITMQ_PASS="$RABBITMQ_PASS" dotnet run --urls http://localhost:5004 > /tmp/loyalpay-admin.log 2>&1 &
nohup env JWT_SECRET="$JWT_SECRET" JWT_ISSUER="$JWT_ISSUER" JWT_AUDIENCE="$JWT_AUDIENCE" dotnet "bin/Debug/net8.0/LoyalPay.Gateway.dll" --urls http://localhost:5000 > /tmp/ocelot-gateway.log 2>&1 &

sleep 3
ss -ltnp | rg '5000|5001|5002|5003|5004' || true
echo "LoyalPay local startup complete."
