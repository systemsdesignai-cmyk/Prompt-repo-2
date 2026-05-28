# Android Signed Release Setup

This guide explains how to set up signed APK releases for your Prompt Repository app.

## Overview

Signed APKs enable:
- ✅ Seamless in-app updates (same signature required for updates)
- ✅ Google Play Store distribution
- ✅ Production-ready releases
- ✅ Automated CI/CD signing via GitHub Actions

## What Was Set Up

### 1. Keystore Generated
A keystore file (`prompt-repo.jks`) has been created with:
- **Store Password**: `SecureStorePass123`
- **Key Alias**: `prompt-key`
- **Key Password**: `SecureStorePass123`
- **Validity**: 10,000 days (~27 years)

### 2. Android Configuration Updated
- Modified `android/app/build.gradle` to include signing configuration
- Added support for release builds with automatic signing

### 3. Build Scripts Enhanced
- Updated `scripts/build-android.sh` to support both debug and release builds
- Added `android:build:release` npm script in `package.json`

### 4. CI/CD Workflow Updated
- Modified `.github/workflows/android-release.yml` to:
  - Build signed APKs on version tags (v*.* format)
  - Build debug APKs on push to main
  - Upload signed APKs to GitHub Releases

## GitHub Secrets Configuration (Required)

You need to configure these secrets in your GitHub repository:

### 1. **ANDROID_KEYSTORE_FILE** (Required for releases)
The base64-encoded keystore file.

```bash
cat /tmp/keystore_base64.txt
```

Copy the full output and:
1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `ANDROID_KEYSTORE_FILE`
4. Paste the base64-encoded keystore

### 2. **KEYSTORE_PASSWORD**
```
SecureStorePass123
```

### 3. **KEY_ALIAS**
```
prompt-key
```

### 4. **KEY_PASSWORD**
```
SecureStorePass123
```

> ⚠️ **Security Note**: These are temporary setup credentials. After your first release, consider rotating the passwords and storing the keystore securely (not in code). For production, store the keystore file in a secure vault and access it via CI/CD secrets.

## Usage

### Local Development (Debug APK)
```bash
npm run android:build:debug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

### Create a Release

1. **Tag a version** (this triggers the release build):
```bash
git tag v1.0.0
git push origin v1.0.0
```

2. **GitHub Actions will**:
   - Build a **signed release APK** automatically
   - Upload it to GitHub Releases
   - Name it: `app-prompt-v1.0.0-signed.apk`

3. **Users can now update** from your app if you implement in-app updates

### Alternative: Build Release Locally
If you need to build a signed APK locally, place your `prompt-repo.jks` in `android/app/` and run:

```bash
BUILD_TYPE=release \
KEYSTORE_PATH=prompt-repo.jks \
KEYSTORE_PASSWORD=SecureStorePass123 \
KEY_ALIAS=prompt-key \
KEY_PASSWORD=SecureStorePass123 \
./scripts/build-android.sh
```

Alternatively, if your keystore is elsewhere, provide the absolute path to `KEYSTORE_PATH`.

APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

## Implementing In-App Updates

To enable seamless updates in your app, you can use:

### Option 1: Capacitor App Plugin
The app already has `@capacitor/app` installed.

```typescript
import { App } from '@capacitor/app';

const checkForUpdates = async () => {
  // Your update check logic here
  // Ensure downloaded APK is signed with the same keystore
};
```

### Option 2: Firebase Remote Config + In-App Updates
Recommended for production apps.

### Option 3: Manual Update Flow
Direct users to GitHub Releases to download and install the signed APK.

## Verifying Signatures

To verify your APK is properly signed:

```bash
jarsigner -verify -verbose -certs android/app/build/outputs/apk/release/app-release.apk
```

## Rotating Credentials (Recommended After First Release)

1. Generate a new keystore with stronger passwords
2. Update GitHub secrets with new credentials
3. Store the old keystore securely in case you need to re-sign updates

## Troubleshooting

### APK Build Fails
- Ensure `ANDROID_HOME` environment variable is set
- Check that Android SDK is installed: `sdkmanager --list | grep "build-tools"`
- Verify Java is installed: `java -version` (should be 21+)

### "Keystore was tampered with" Error
- Verify base64 encoding/decoding of `ANDROID_KEYSTORE_FILE` secret
- Ensure passwords in secrets match exactly

### App Won't Update
- Verify both old and new APKs are signed with the same keystore
- Check both have different `versionCode` in `android/app/build.gradle`
- Different signatures will block updates

## Next Steps

1. ✅ Add secrets to GitHub
2. ✅ Create and push a version tag to trigger the first build
3. ✅ Download the signed APK from GitHub Releases
4. ✅ Test installing it on a device
5. ✅ Implement in-app update checking
6. ✅ Consider backing up the keystore securely (not in git)

## Files Modified

- `android/app/build.gradle` - Added signing configuration
- `scripts/build-android.sh` - Enhanced to support release builds
- `package.json` - Added `android:build:release` script
- `.github/workflows/android-release.yml` - Updated for signed releases

---

**Important**: Keep your keystore file and passwords safe. Losing them means you cannot update your app with the same signature in the future.
