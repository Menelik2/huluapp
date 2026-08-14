#!/usr/bin/env bash
# Generate a Google Play upload keystore for Kulu
# Run from repo: bash android/keystore/generate-upload-key.sh
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
OUT="$DIR/kulu-upload.jks"
ALIAS="kulu-upload"

if [[ -f "$OUT" ]]; then
  echo "Already exists: $OUT"
  echo "Delete it first if you intentionally want a new key (you cannot replace Play upload keys casually)."
  exit 1
fi

echo "Creating upload keystore at $OUT"
echo "Remember the passwords — required for every Play release."
keytool -genkeypair -v \
  -storetype JKS \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -keystore "$OUT" \
  -alias "$ALIAS" \
  -dname "CN=Kulu Mobile, OU=Mobile, O=Kulu, L=Addis Ababa, ST=Addis Ababa, C=ET"

echo ""
echo "Next:"
echo "  1. Copy key.properties.example → key.properties"
echo "  2. Fill storePassword, keyPassword, keyAlias=$ALIAS"
echo "  3. storeFile=keystore/kulu-upload.jks"
echo "  4. cd android && ./gradlew bundleRelease"
echo ""
echo "Keep $OUT offline/backed up. Losing it blocks app updates on Play."
