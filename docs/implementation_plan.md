# iOS Build and Distribution Setup (TestFlight + Ad Hoc OTA)

This plan outlines the implementation of iOS platform support and GitHub Actions workflows for building and releasing the iOS application. This includes:
1. **iOS Platform Support**: Installing `@capacitor/ios` and initializing the iOS project.
2. **TestFlight Distribution Workflow**: Triggered on releases to compile, sign, and upload the IPA to Apple TestFlight.
3. **Ad Hoc OTA Workflow**: Triggered manually or on tag creation to compile, sign, and upload an Ad Hoc IPA to GitHub Releases, then deploy a companion `manifest.plist` and a premium download landing page to GitHub Pages.

---

## User Review Required

> [!IMPORTANT]
> **GitHub Secrets Configuration**
> To sign and build the iOS app in GitHub Actions, you must add the following secrets in your repository settings (**Settings > Secrets and variables > Actions**):
> *   `IOS_P12_CERTIFICATE_BASE64`: Your iOS distribution certificate `.p12` file encoded in base64.
> *   `IOS_P12_PASSWORD`: The password used to protect the `.p12` certificate.
> *   `IOS_PROVISION_PROFILE_BASE64`: The Ad Hoc and/or App Store provisioning profile `.mobileprovision` file encoded in base64.
> *   `IOS_TEAM_ID`: Your Apple Developer Team ID (10-character alphanumeric code).
> *   `IOS_PROVISION_PROFILE_NAME`: The exact name of your provisioning profile (as shown in your developer account).
> *   `APP_STORE_CONNECT_API_KEY_ID`: (For TestFlight) Your App Store Connect API Key ID.
> *   `APP_STORE_CONNECT_ISSUER_ID`: (For TestFlight) Your App Store Connect Issuer ID.
> *   `APP_STORE_CONNECT_API_KEY_BASE64`: (For TestFlight) Your App Store Connect private key `.p8` file encoded in base64.

> [!WARNING]
> **Enable GitHub Pages**
> For the Ad Hoc OTA installation link (`itms-services://`) to work, you must enable GitHub Pages on your repository:
> 1. Go to **Settings > Pages**.
> 2. Under **Build and deployment > Source**, select **GitHub Actions**.
> 3. Ensure the workflow has write permissions to deploy to GitHub Pages.

---

## Open Questions

> [!NOTE]
> There are no major open questions, as the workflow is standard. However, you will need to register all test device UDIDs in your Apple Developer account before building the Ad Hoc IPA, otherwise they will fail to install.

---

## Proposed Changes

### Dependencies & Configuration

#### [MODIFY] [package.json](file:///workspaces/Prompt-repo-2/package.json)
- Add `"@capacitor/ios": "^7.4.3"` to dependencies to enable Capacitor iOS platform support.
- Add npm scripts to sync and run debug simulator builds for iOS:
  - `"ios:sync": "npx cap sync ios"`
  - `"ios:build:debug": "xcodebuild -workspace ios/App/App.xcworkspace -scheme App -sdk iphonesimulator -configuration Debug CODE_SIGNING_ALLOWED=NO"`

#### [MODIFY] [capacitor.config.ts](file:///workspaces/Prompt-repo-2/capacitor.config.ts)
- Standard config check to ensure it supports iOS (the existing configuration is already platform-agnostic).

---

### Build Scripts

#### [NEW] [build-ios.sh](file:///workspaces/Prompt-repo-2/scripts/build-ios.sh)
- A bash script to build the web project, add the iOS platform if missing, and sync configuration to the native iOS app.

---

### CI/CD Workflows

#### [NEW] [ios-release-testflight.yml](file:///workspaces/Prompt-repo-2/.github/workflows/ios-release-testflight.yml)
- Job triggered on tags `v*`.
- Compiles the iOS app on `macos-latest`.
- Sets up signing certificates and provisioning profiles.
- Archives and exports the App Store IPA.
- Uploads the IPA to App Store Connect (TestFlight) using App Store Connect API key authentication.

#### [NEW] [ios-release-adhoc.yml](file:///workspaces/Prompt-repo-2/.github/workflows/ios-release-adhoc.yml)
- Job triggered manually (`workflow_dispatch`) and on tags `v*`.
- Compiles the iOS app on `macos-latest`.
- Sets up signing certificates and provisioning profiles for Ad Hoc.
- Archives and exports the Ad Hoc IPA.
- Uploads the IPA to GitHub Releases.
- Dynamically generates the `manifest.plist` pointing to the release IPA.
- Generates a beautiful glassmorphic landing page (`index.html`) containing the `itms-services://` installation link.
- Deploys the landing page and plist to GitHub Pages.

---

## Verification Plan

### Automated Tests
- Validate that dependencies install correctly and `npm run build` completes.
- Run local simulation compile: `npm run ios:sync && npm run ios:build:debug` to ensure the Capacitor iOS template compiles successfully without signing errors.

### Manual Verification
- Commit and push to a branch to verify the workflow files are valid.
- The user will trigger the workflows in GitHub Actions after setting up their secrets to confirm successful TestFlight uploading and Pages deployment.
