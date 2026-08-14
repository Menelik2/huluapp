#!/usr/bin/env bash
# Smoke-test Kulu API after deploy
# Usage: export API_BASE=https://api.yourdomain.com/api && bash healthcheck_api.sh

set -euo pipefail
API_BASE="${API_BASE:-https://api.example.com/api}"
API_BASE="${API_BASE%/}"
FAIL=0

check() {
  local name="$1" url="$2" expect="$3"
  code=$(curl -sS -o /tmp/kulu_hc_body.txt -w "%{http_code}" "$url" || echo "000")
  if [[ "$code" == "$expect" ]]; then
    echo "OK  $name ($code)"
  else
    echo "FAIL $name (got $code, want $expect)"
    head -c 200 /tmp/kulu_hc_body.txt; echo
    FAIL=1
  fi
}

echo "Healthcheck → $API_BASE"
# Laravel health route is outside /api on default install; try both
ROOT="${API_BASE%/api}"
check "products" "$API_BASE/products" "200"
check "categories" "$API_BASE/categories" "200"
check "auth missing token body" "$API_BASE/auth/google" "422"
# admin without auth
code=$(curl -sS -o /tmp/kulu_hc_body.txt -w "%{http_code}" "$API_BASE/admin/overview" || echo "000")
if [[ "$code" == "401" || "$code" == "403" ]]; then
  echo "OK  admin protected ($code)"
else
  echo "FAIL admin should be 401/403 (got $code)"
  FAIL=1
fi

check "chapa webhook missing ref" "$API_BASE/payments/chapa/webhook" "400"

if [[ "$FAIL" -eq 0 ]]; then
  echo "All checks passed"
  exit 0
fi
echo "Some checks failed"
exit 1
