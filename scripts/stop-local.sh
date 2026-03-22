#!/usr/bin/env bash
set -e

pkill -f "LoyalPay\\.AuthService|LoyalPay\\.WalletService|LoyalPay\\.RewardsService|LoyalPay\\.AdminService|LoyalPay\\.Gateway|dotnet .*LoyalPay.Gateway" || true
docker compose down

echo "LoyalPay local services and infra stopped."
