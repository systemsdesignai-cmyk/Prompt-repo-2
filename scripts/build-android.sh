#!/usr/bin/env bash
set -euo pipefail
npm run build
if [[ ! -f "android/gradlew" ]]; then
  rm -rf android
  npx cap add android
fi
npm run android:sync

# Detect if Android SDK is available
ANDROID_SDK_FOUND=false
if [[ -n "${ANDROID_HOME:-}" && -d "$ANDROID_HOME" ]]; then
  ANDROID_SDK_FOUND=true
elif [[ -f "android/local.properties" ]] && grep -q "^sdk.dir=" "android/local.properties"; then
  ANDROID_SDK_FOUND=true
elif command -v sdkmanager &> /dev/null || command -v adb &> /dev/null; then
  ANDROID_SDK_FOUND=true
fi

if [ "$ANDROID_SDK_FOUND" = true ]; then
  npm run android:build:debug
else
  echo "Android SDK not found. Skipping native debug build. Define ANDROID_HOME or set sdk.dir in android/local.properties to compile the APK."
fi

