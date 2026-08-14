#!/usr/bin/env bash
# Test Chapa webhook endpoint (live or test).
#
# Chapa will POST/GET your webhook with tx_ref after payment.
# This script simulates a client call so you can verify routing, HTTPS, and response.
#
# Usage:
#   export API_BASE=https://api.yourdomain.com/api
#   export TX_REF=your-chapa-tx-ref-from-a-real-or-test-payment
#   bash test_chapa_webhook.sh
#
# Optional:
#   export WEBHOOK_PATH=/payments/chapa/webhook

set -euo pipefail

API_BASE="${API_BASE:-https://api.example.com/api}"
WEBHOOK_PATH="${WEBHOOK_PATH:-/payments/chapa/webhook}"
TX_REF="${TX_REF:-}"

API_BASE="${API_BASE%/}"
URL="${API_BASE}${WEBHOOK_PATH}"

echo "Chapa webhook test"
echo "  URL: $URL"
echo ""

# 1) OPTIONS / connectivity
echo "== GET (some Chapa setups probe GET) =="
curl -sS -D - -o /tmp/kulu_chapa_get_body.txt -X GET "$URL" | head -n 20
echo "Body:"
head -c 500 /tmp/kulu_chapa_get_body.txt || true
echo ""
echo ""

echo "== POST without tx_ref (expect validation error, proves route works) =="
curl -sS -D - -o /tmp/kulu_chapa_post_empty.txt -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{}' | head -n 20
echo "Body:"
cat /tmp/kulu_chapa_post_empty.txt
echo ""
echo ""

if [[ -z "$TX_REF" ]]; then
  echo "Set TX_REF to a real transaction reference to test verify flow:"
  echo "  export TX_REF=TX-....."
  echo "  bash test_chapa_webhook.sh"
  exit 0
fi

echo "== POST with tx_ref (server should call Chapa verify API) =="
curl -sS -D - -o /tmp/kulu_chapa_post_tx.txt -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{\"tx_ref\":\"${TX_REF}\",\"status\":\"success\"}" | head -n 25
echo "Body:"
cat /tmp/kulu_chapa_post_tx.txt
echo ""
echo ""

echo "== Alternate form field names Chapa may send =="
curl -sS -o /tmp/kulu_chapa_post_form.txt -X POST "$URL" \
  -H "Accept: application/json" \
  -d "trx_ref=${TX_REF}&status=success"
echo "form body response:"
cat /tmp/kulu_chapa_post_form.txt
echo ""

echo "Done. Check Laravel log if payment_status did not update:"
echo "  tail -n 50 storage/logs/laravel.log"
