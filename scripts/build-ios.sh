#!/usr/bin/env bash
set -euo pipefail
npm run build
if [[ ! -d "ios" ]]; then
  npx cap add ios
fi
npm run ios:sync

# Only try to compile if xcodebuild is available
if command -v xcodebuild &> /dev/null; then
  npm run ios:build:debug
else
  echo "xcodebuild not found, skipping simulator build."
fi

