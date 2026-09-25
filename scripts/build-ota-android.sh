#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 || ! "$1" =~ ^[1-9][0-9]*$ ]]; then
  echo "Usage: yarn ota:build:android <version> [release notes]"
  exit 1
fi

OTA_VERSION="$1"
RELEASE_NOTES="${2:-App improvements and fixes}"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT_DIR="$PROJECT_ROOT/ota/output"
RELEASE_DIR="$PROJECT_ROOT/ota/releases"
ZIP_NAME="android-v${OTA_VERSION}.zip"

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR" "$RELEASE_DIR"

cd "$PROJECT_ROOT"
node_modules/.bin/react-native bundle \
  --platform android \
  --dev false \
  --minify true \
  --entry-file index.js \
  --bundle-output "$OUTPUT_DIR/index.android.bundle" \
  --assets-dest "$OUTPUT_DIR"

rm -f "$RELEASE_DIR/$ZIP_NAME"
cd "$PROJECT_ROOT/ota"
zip -qr "$RELEASE_DIR/$ZIP_NAME" output

node - "$PROJECT_ROOT/ota/update.json" "$OTA_VERSION" "$RELEASE_NOTES" <<'NODE'
const fs = require('fs');
const [file, version, notes] = process.argv.slice(2);
const manifest = {
  version: Number(version),
  runtimeVersion: '1.0',
  minimumVersionCode: 1,
  downloadAndroidUrl: `https://raw.githubusercontent.com/devjigneshkubavat/reminder-todo-app/main/ota/releases/android-v${version}.zip`,
  releaseNotes: notes,
  mandatory: false,
};
fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
NODE

rm -rf "$OUTPUT_DIR"
echo "Created ota/releases/$ZIP_NAME and updated ota/update.json"
echo "Commit and push both files to publish this OTA release."
