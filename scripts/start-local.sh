#!/usr/bin/env bash
set -e

if [ ! -f ".env" ]; then
  echo "Missing .env file. Copy .env.example to .env and set values first."
  exit 1
fi

set -a
source .env
set +a

if [ -z "${SQL_SA_PASSWORD:-}" ] || [ -z "${RABBITMQ_USER:-}" ] || [ -z "${RABBITMQ_PASS:-}" ] || [ -z "${JWT_SECRET:-}" ]; then
  echo "Missing required env values. Set SQL_SA_PASSWORD, RABBITMQ_USER, RABBITMQ_PASS, JWT_SECRET in .env"
  exit 1
fi

AUTH_DB="Server=localhost,1433;Database=LoyalPayAuthDb;User Id=sa;Password=${SQL_SA_PASSWORD};TrustServerCertificate=True;"
WALLET_DB="Server=localhost,1433;Database=LoyalPayWalletDb;User Id=sa;Password=${SQL_SA_PASSWORD};TrustServerCertificate=True;"
REWARDS_DB="Server=localhost,1433;Database=LoyalPayRewardsDb;User Id=sa;Password=${SQL_SA_PASSWORD};TrustServerCertificate=True;"

docker compose up -d

echo "Waiting for SQL Server to be ready..."
for i in $(seq 1 60); do
  if docker exec loyalpay-sql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$SQL_SA_PASSWORD" -Q "SELECT 1" -C >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! docker exec loyalpay-sql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$SQL_SA_PASSWORD" -Q "SELECT 1" -C >/dev/null 2>&1; then
  echo "SQL Server did not become ready in time."
  exit 1
fi

echo "Waiting for RabbitMQ to be ready..."
for i in $(seq 1 60); do
  if docker exec loyalpay-rabbit rabbitmq-diagnostics -q ping >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! docker exec loyalpay-rabbit rabbitmq-diagnostics -q ping >/dev/null 2>&1; then
  echo "RabbitMQ did not become ready in time."
  exit 1
fi

pkill -f "LoyalPay\\.AuthService|LoyalPay\\.WalletService|LoyalPay\\.RewardsService|LoyalPay\\.AdminService|LoyalPay\\.Gateway|dotnet .*LoyalPay.Gateway" || true

echo "Building backend solution once before service startup..."
dotnet build "backend/LoyalPay.slnx" >/tmp/loyalpay-build.log 2>&1

nohup env AUTH_DB="$AUTH_DB" JWT_SECRET="$JWT_SECRET" JWT_ISSUER="${JWT_ISSUER:-LoyalPay}" JWT_AUDIENCE="${JWT_AUDIENCE:-LoyalPayUsers}" RABBITMQ_HOST="${RABBITMQ_HOST:-localhost}" RABBITMQ_USER="$RABBITMQ_USER" RABBITMQ_PASS="$RABBITMQ_PASS" dotnet run --no-build --project backend/LoyalPay.AuthService/LoyalPay.AuthService.csproj --urls http://localhost:5001 > /tmp/loyalpay-auth.log 2>&1 &
nohup env WALLET_DB="$WALLET_DB" JWT_SECRET="$JWT_SECRET" JWT_ISSUER="${JWT_ISSUER:-LoyalPay}" JWT_AUDIENCE="${JWT_AUDIENCE:-LoyalPayUsers}" RABBITMQ_HOST="${RABBITMQ_HOST:-localhost}" RABBITMQ_USER="$RABBITMQ_USER" RABBITMQ_PASS="$RABBITMQ_PASS" dotnet run --no-build --project backend/LoyalPay.WalletService/LoyalPay.WalletService.csproj --urls http://localhost:5002 > /tmp/loyalpay-wallet.log 2>&1 &
nohup env REWARDS_DB="$REWARDS_DB" JWT_SECRET="$JWT_SECRET" JWT_ISSUER="${JWT_ISSUER:-LoyalPay}" JWT_AUDIENCE="${JWT_AUDIENCE:-LoyalPayUsers}" RABBITMQ_HOST="${RABBITMQ_HOST:-localhost}" RABBITMQ_USER="$RABBITMQ_USER" RABBITMQ_PASS="$RABBITMQ_PASS" dotnet run --no-build --project backend/LoyalPay.RewardsService/LoyalPay.RewardsService.csproj --urls http://localhost:5003 > /tmp/loyalpay-rewards.log 2>&1 &
nohup env AUTH_DB="$AUTH_DB" WALLET_DB="$WALLET_DB" REWARDS_DB="$REWARDS_DB" JWT_SECRET="$JWT_SECRET" JWT_ISSUER="${JWT_ISSUER:-LoyalPay}" JWT_AUDIENCE="${JWT_AUDIENCE:-LoyalPayUsers}" RABBITMQ_HOST="${RABBITMQ_HOST:-localhost}" RABBITMQ_USER="$RABBITMQ_USER" RABBITMQ_PASS="$RABBITMQ_PASS" dotnet run --no-build --project backend/LoyalPay.AdminService/LoyalPay.AdminService.csproj --urls http://localhost:5004 > /tmp/loyalpay-admin.log 2>&1 &
nohup env JWT_SECRET="$JWT_SECRET" JWT_ISSUER="${JWT_ISSUER:-LoyalPay}" JWT_AUDIENCE="${JWT_AUDIENCE:-LoyalPayUsers}" dotnet run --no-build --project backend/LoyalPay.Gateway/LoyalPay.Gateway.csproj --urls http://localhost:5000 > /tmp/ocelot-gateway.log 2>&1 &

echo "Waiting for all service ports..."
for i in $(seq 1 40); do
  count=$(ss -ltnp | rg -c '127\.0\.0\.1:5000|127\.0\.0\.1:5001|127\.0\.0\.1:5002|127\.0\.0\.1:5003|127\.0\.0\.1:5004' || echo 0)
  if [ "$count" -ge 5 ]; then
    break
  fi
  sleep 1
done

ss -ltnp | rg '5000|5001|5002|5003|5004' || true
echo "LoyalPay local startup complete."
