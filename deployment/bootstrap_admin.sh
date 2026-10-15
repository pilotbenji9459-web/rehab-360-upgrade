#!/usr/bin/env bash
# Bootstrap Script for REHABPATH360 Clean Deployment
# Claims the first Administrator account on an uninitialized facility instance.

set -e

HOST="${1:-http://localhost:3000}"
INSTITUTION_NAME="${2:-Correctional Rehabilitation Facility}"
INSTITUTION_CODE="${3:-CRF-01}"
ADMIN_EMAIL="${4:-admin@rehabilitation.gov}"
ADMIN_PASSWORD="${5:-AdminSecurePass2026!}"
ADMIN_NAME="${6:-Primary Administrator}"

echo "Initializing First Administrator for REHABPATH360..."
echo "Host: ${HOST}"
echo "Institution: ${INSTITUTION_NAME} (${INSTITUTION_CODE})"
echo "Admin Email: ${ADMIN_EMAIL}"

RESPONSE=$(curl -s -X POST "${HOST}/api/setup/bootstrap-admin" \
  -H "Content-Type: application/json" \
  -d "{
    \"institution_name\": \"${INSTITUTION_NAME}\",
    \"institution_code\": \"${INSTITUTION_CODE}\",
    \"admin_email\": \"${ADMIN_EMAIL}\",
    \"admin_password\": \"${ADMIN_PASSWORD}\",
    \"admin_name\": \"${ADMIN_NAME}\",
    \"admin_badge\": \"ADM-01\"
  }")

echo ""
echo "Server Response:"
echo "${RESPONSE}"
echo ""
echo "Bootstrap sequence finished. Verify status code in output."
