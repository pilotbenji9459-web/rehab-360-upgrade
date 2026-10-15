#!/usr/bin/env bash
set -euo pipefail

HOST="${1:-http://localhost:3000}"
INSTITUTION_NAME="${2:-Correctional Rehabilitation Facility}"
INSTITUTION_CODE="${3:-CRF-01}"
ADMIN_EMAIL="${4:-admin@example.invalid}"
ADMIN_NAME="${5:-Primary Administrator}"
ADMIN_BADGE="${6:-ADM-01}"

if ! command -v curl >/dev/null 2>&1; then
  echo "Error: curl is required."
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "Error: jq is required to safely encode JSON."
  exit 1
fi

if [[ -z "${SETUP_TOKEN:-}" ]]; then
  read -r -s -p "Enter the SETUP_TOKEN configured on the server: " SETUP_TOKEN
  printf '\n'
fi

if [[ ${#SETUP_TOKEN} -lt 32 ]]; then
  echo "Error: SETUP_TOKEN must be at least 32 characters."
  exit 1
fi

if [[ -z "${ADMIN_PASSWORD:-}" ]]; then
  read -r -s -p "Choose the new admin password (at least 12 characters): " ADMIN_PASSWORD
  printf '\n'
  read -r -s -p "Confirm admin password: " PASSWORD_CONFIRM
  printf '\n'

  if [[ "$ADMIN_PASSWORD" != "$PASSWORD_CONFIRM" ]]; then
    echo "Error: Passwords do not match."
    exit 1
  fi
fi

if [[ ${#ADMIN_PASSWORD} -lt 12 ]]; then
  echo "Error: Admin password must be at least 12 characters."
  exit 1
fi

PAYLOAD=$(jq -n \
  --arg institution_name "$INSTITUTION_NAME" \
  --arg institution_code "$INSTITUTION_CODE" \
  --arg admin_email "$ADMIN_EMAIL" \
  --arg admin_password "$ADMIN_PASSWORD" \
  --arg admin_name "$ADMIN_NAME" \
  --arg admin_badge "$ADMIN_BADGE" \
  --arg setup_token "$SETUP_TOKEN" \
  '{
    institution_name: $institution_name,
    institution_code: $institution_code,
    admin_email: $admin_email,
    admin_password: $admin_password,
    admin_name: $admin_name,
    admin_badge: $admin_badge,
    setup_token: $setup_token
  }')

RESPONSE_FILE=$(mktemp)
trap 'rm -f "$RESPONSE_FILE"' EXIT

HTTP_STATUS=$(curl -sS \
  -o "$RESPONSE_FILE" \
  -w '%{http_code}' \
  -X POST "${HOST}/api/setup/bootstrap-admin" \
  -H "Content-Type: application/json" \
  --data-binary "$PAYLOAD")

unset ADMIN_PASSWORD PASSWORD_CONFIRM SETUP_TOKEN PAYLOAD

if [[ "$HTTP_STATUS" == "201" ]]; then
  echo "Administrator setup succeeded."
  echo "Sign in through the application to continue."
else
  echo "Administrator setup failed (HTTP ${HTTP_STATUS})."
  cat "$RESPONSE_FILE"
  exit 1
fi