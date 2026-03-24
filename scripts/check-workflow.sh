#!/usr/bin/env bash
set -euo pipefail

if [ ! -f ".env" ]; then
  echo "Missing .env file. Copy .env.example to .env and set values first."
  exit 1
fi

wait_for_url() {
  local url="$1"
  local name="$2"
  local max_attempts="$3"
  local attempt=1

  while [ "$attempt" -le "$max_attempts" ]; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi

    sleep 1
    attempt=$((attempt + 1))
  done

  echo "Service check failed: $name is not reachable at $url"
  return 1
}

json_field() {
  local json_input="$1"
  local python_path="$2"

  JSON_INPUT="$json_input" PYTHON_PATH="$python_path" python - <<'PY'
import json
import os

raw = os.environ.get("JSON_INPUT", "")
path = os.environ.get("PYTHON_PATH", "")

try:
    obj = json.loads(raw)
except Exception:
    print("")
    raise SystemExit(0)

parts = [p for p in path.split(".") if p]
value = obj
for part in parts:
    if isinstance(value, dict):
        value = value.get(part)
    else:
        value = None
        break

if value is None:
    print("")
elif isinstance(value, bool):
    print("true" if value else "false")
else:
    print(str(value))
PY
}

assert_success_response() {
  local response="$1"
  local step_name="$2"
  local success

  success="$(json_field "$response" "success")"

  if [ "$success" != "true" ]; then
    echo "Failed step: $step_name"
    echo "Response: $response"
    exit 1
  fi
}

wait_for_wallet() {
  local token="$1"
  local endpoint="$2"
  local max_attempts=15
  local attempt=1
  local response

  while [ "$attempt" -le "$max_attempts" ]; do
    response="$(curl -s -H "Authorization: Bearer $token" "$endpoint")"
    if [ "$(json_field "$response" "success")" = "true" ]; then
      echo "$response"
      return 0
    fi

    sleep 1
    attempt=$((attempt + 1))
  done

  echo "$response"
  return 1
}

echo "Checking service availability..."
wait_for_url "http://localhost:5000/rewards/catalog" "Gateway" 40
wait_for_url "http://localhost:5001/swagger/index.html" "AuthService" 40
wait_for_url "http://localhost:5002/swagger/index.html" "WalletService" 40
wait_for_url "http://localhost:5003/swagger/index.html" "RewardsService" 40
wait_for_url "http://localhost:5004/swagger/index.html" "AdminService" 40

echo "Running end-to-end workflow checks..."
TS="$(date +%s)"
USER1_EMAIL="rajesh.${TS}@finwallet.test"
USER2_EMAIL="priya.${TS}@finwallet.test"
PASS="SecurePass@456"

SIGNUP_1="$(curl -s -X POST http://localhost:5000/signup -H "Content-Type: application/json" -d "{\"fullName\":\"Rajesh Kumar\",\"email\":\"$USER1_EMAIL\",\"phone\":\"+91-9811111111\",\"password\":\"$PASS\"}")"
assert_success_response "$SIGNUP_1" "Gateway signup user 1"

SIGNUP_2="$(curl -s -X POST http://localhost:5000/signup -H "Content-Type: application/json" -d "{\"fullName\":\"Priya Sharma\",\"email\":\"$USER2_EMAIL\",\"phone\":\"+91-9822222222\",\"password\":\"$PASS\"}")"
assert_success_response "$SIGNUP_2" "Gateway signup user 2"

TOKEN_1="$(json_field "$SIGNUP_1" "data.accessToken")"
TOKEN_2="$(json_field "$SIGNUP_2" "data.accessToken")"
USER_2_ID="$(json_field "$SIGNUP_2" "data.userId")"

PROFILE_GW="$(curl -s -H "Authorization: Bearer $TOKEN_1" http://localhost:5000/profile)"
assert_success_response "$PROFILE_GW" "Gateway profile"

PROFILE_API="$(curl -s -H "Authorization: Bearer $TOKEN_1" http://localhost:5001/api/profile)"
assert_success_response "$PROFILE_API" "Direct profile API"

BALANCE_GW="$(wait_for_wallet "$TOKEN_1" "http://localhost:5000/wallet/balance")"
assert_success_response "$BALANCE_GW" "Gateway wallet balance"

BALANCE_API="$(wait_for_wallet "$TOKEN_1" "http://localhost:5002/api/wallet/balance")"
assert_success_response "$BALANCE_API" "Direct wallet balance API"

CATALOG_GW="$(curl -s http://localhost:5000/rewards/catalog)"
assert_success_response "$CATALOG_GW" "Gateway rewards catalog"

SUMMARY_GW="$(curl -s -H "Authorization: Bearer $TOKEN_1" http://localhost:5000/rewards/summary)"
assert_success_response "$SUMMARY_GW" "Gateway rewards summary"

SUMMARY_API="$(curl -s -H "Authorization: Bearer $TOKEN_1" http://localhost:5003/api/rewards/summary)"
assert_success_response "$SUMMARY_API" "Direct rewards summary API"

TOPUP_START="$(curl -s -X POST http://localhost:5000/wallet/topup -H "Authorization: Bearer $TOKEN_1" -H "Content-Type: application/json" -d '{"amount":1250.75,"paymentMethod":"UPI"}')"
assert_success_response "$TOPUP_START" "Top-up start"

TOPUP_ID="$(json_field "$TOPUP_START" "data.topUpId")"

TOPUP_FINISH="$(curl -s -X POST http://localhost:5000/wallet/topup/$TOPUP_ID/finish -H "Authorization: Bearer $TOKEN_1" -H "Content-Type: application/json" -d '{"success":true}')"
assert_success_response "$TOPUP_FINISH" "Top-up finish"

sleep 2

BALANCE_AFTER_TOPUP="$(curl -s -H "Authorization: Bearer $TOKEN_1" http://localhost:5000/wallet/balance)"
assert_success_response "$BALANCE_AFTER_TOPUP" "Wallet balance after top-up"

TRANSFER="$(curl -s -X POST http://localhost:5000/wallet/transfer -H "Authorization: Bearer $TOKEN_1" -H "Content-Type: application/json" -d "{\"receiverUserId\":\"$USER_2_ID\",\"amount\":430.25,\"note\":\"Rent split March\"}")"
assert_success_response "$TRANSFER" "Wallet transfer"

U1_BALANCE_AFTER_TRANSFER="$(curl -s -H "Authorization: Bearer $TOKEN_1" http://localhost:5000/wallet/balance)"
assert_success_response "$U1_BALANCE_AFTER_TRANSFER" "User1 balance after transfer"

U2_BALANCE_AFTER_TRANSFER="$(curl -s -H "Authorization: Bearer $TOKEN_2" http://localhost:5000/wallet/balance)"
assert_success_response "$U2_BALANCE_AFTER_TRANSFER" "User2 balance after transfer"

REWARDS_AFTER_TOPUP="$(curl -s -H "Authorization: Bearer $TOKEN_1" http://localhost:5000/rewards/summary)"
assert_success_response "$REWARDS_AFTER_TOPUP" "Rewards summary after top-up"

REWARD_HISTORY="$(curl -s -H "Authorization: Bearer $TOKEN_1" http://localhost:5000/rewards/history)"
assert_success_response "$REWARD_HISTORY" "Rewards history"

TXN_HISTORY="$(curl -s -H "Authorization: Bearer $TOKEN_1" "http://localhost:5000/wallet/transactions?page=1&size=20")"
assert_success_response "$TXN_HISTORY" "Wallet transaction history"

ADMIN_LOGIN="$(curl -s -X POST http://localhost:5000/login -H "Content-Type: application/json" -d '{"email":"admin@loyalpay.com","password":"Admin@123"}')"
assert_success_response "$ADMIN_LOGIN" "Admin login"

ADMIN_TOKEN="$(json_field "$ADMIN_LOGIN" "data.accessToken")"

ADMIN_DASHBOARD="$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:5000/admin/dashboard)"
assert_success_response "$ADMIN_DASHBOARD" "Admin dashboard"

ADMIN_USERS="$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:5000/admin/users)"
assert_success_response "$ADMIN_USERS" "Admin users"

TOTAL_POINTS="$(json_field "$REWARDS_AFTER_TOPUP" "data.totalPoints")"

if [ -z "$TOTAL_POINTS" ] || [ "$TOTAL_POINTS" = "0" ]; then
  echo "Failed step: Rewards points after top-up"
  echo "Response: $REWARDS_AFTER_TOPUP"
  exit 1
fi

echo "Workflow check passed."
echo "User1: $USER1_EMAIL"
echo "User2: $USER2_EMAIL"
echo "Top-up ID: $TOPUP_ID"
echo "User1 points after top-up: $TOTAL_POINTS"
