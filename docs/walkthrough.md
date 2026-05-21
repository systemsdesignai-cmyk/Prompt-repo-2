# Walkthrough - iOS Build & Release Implementation

We have successfully implemented iOS build support and configured the automated release pipelines for TestFlight and Ad Hoc OTA distribution.

## Changes Made

### 1. Project Configuration & Build Scripts
- **[@capacitor/ios](file:///workspaces/Prompt-repo-2/package.json)** dependency installed.
- **[package.json](file:///workspaces/Prompt-repo-2/package.json)**: Added scripts `ios:sync` (syncing web code to native iOS package) and `ios:build:debug` (build simulator debug version using xcodebuild).
- **[build-ios.sh](file:///workspaces/Prompt-repo-2/scripts/build-ios.sh)**: A robust shell script that builds the production web assets, checks if the native iOS project exists, runs Capacitor sync, and conditionally compiles the simulator debug build if `xcodebuild` is present on the host environment (safeguarding it on Linux development workspaces).

### 2. GitHub Actions Workflows
- **[ios-release-testflight.yml](file:///workspaces/Prompt-repo-2/.github/workflows/ios-release-testflight.yml)**: Automated pipeline to build, archive, export, and upload the App Store IPA to TestFlight using App Store Connect API keys. Runs on `macos-15`.
- **[ios-release-adhoc.yml](file:///workspaces/Prompt-repo-2/.github/workflows/ios-release-adhoc.yml)**: Automated pipeline for Ad Hoc distribution. It builds and archives the Ad Hoc IPA, uploads it to GitHub Releases, and dynamically deploys a companion `manifest.plist` and a **premium, glassmorphic download landing page** to GitHub Pages.

---

## The OTA Landing Page Design

We designed a stunning, highly premium landing page that is generated on-the-fly and deployed directly to GitHub Pages. Features include:
- Deep dark theme with animated radial glowing backdrop elements.
- Clean glassmorphic layout card (`backdrop-filter: blur(20px)`).
- Glowing app icon with a subtle interactive pulse animation.
- A premium CTA button that triggers iOS's native `itms-services://` package installer.
- Clear, numbered step-by-step instructions for installation and certificate trust verification.

---

## Action Items for You

To run these workflows successfully, please set up the following secrets in your GitHub repository (**Settings > Secrets and variables > Actions**):

| Secret Name | Description |
| :--- | :--- |
| `IOS_P12_CERTIFICATE_BASE64` | Base64 encoded `.p12` file of your iOS Distribution certificate |
| `IOS_P12_PASSWORD` | Password for your `.p12` certificate |
| `IOS_PROVISION_PROFILE_BASE64` | Base64 encoded `.mobileprovision` file (Ad Hoc or App Store profile) |
| `IOS_TEAM_ID` | Your 10-character Apple Developer Team ID |
| `IOS_PROVISION_PROFILE_NAME` | The exact name of your provisioning profile |
| `APP_STORE_CONNECT_API_KEY_ID` | App Store Connect API Key ID (for TestFlight uploads) |
| `APP_STORE_CONNECT_ISSUER_ID` | App Store Connect Issuer ID (for TestFlight uploads) |
| `APP_STORE_CONNECT_API_KEY_BASE64` | Base64 encoded `.p8` private key file |

> [!WARNING]
> **Enable GitHub Pages**
> Make sure to enable GitHub Pages in your repository settings (**Settings > Pages**) and set the build source to **GitHub Actions** so that the Ad Hoc OTA landing page can be deployed automatically!
