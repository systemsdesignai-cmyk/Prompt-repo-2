# Prompt Repository - Project Instructions

This document provides foundational mandates and context for engineering tasks within the Prompt Repository monorepo. All agent interactions should adhere to these standards.

## Project Overview

Prompt Repository is a sophisticated toolset for managing, syncing, and deploying AI prompts and agent skills. It is structured as a Turborepo monorepo with the following components:

- **`apps/mobile`**: A high-performance mobile application built with **Ionic, React, and Capacitor**. It serves as the primary UI for users to manage their prompt library, with features like GitHub Gist synchronization and internal APK updates.
- **`apps/mcp-server`**: A Node.js-based **Model Context Protocol (MCP)** server. it allows AI agents to interact with the repository via a standardized stdio-based JSON-RPC interface.
- **`skills/prompt-repository`**: A localized skill package that provides expert guidance and templates for agents working with this repository.

### Key Technologies
- **Frontend**: React (Vite), Tailwind CSS, Lucide React.
- **Native**: Capacitor 7 (Android & iOS).
- **Backend/MCP**: Node.js (ESM).
- **Monorepo**: npm Workspaces, Turborepo.

---

## Building and Running

Commands should generally be run from the root directory using npm workspaces or Turbo.

### Global Commands
- **Install Dependencies**: `npm install`
- **Build All Workspaces**: `npm run build`
- **CI Validation**: `npm run ci` (runs builds and syntax checks across all apps)

### Mobile App (`apps/mobile`)
- **Development Server**: `npm --workspace @prompt-repository/mobile run dev`
- **Sync Native Projects**: `npm run cap:sync` (syncs web assets to Android/iOS)
- **Android Debug Build**: `npm run android:build:debug`
- **iOS Debug Build**: `npm run ios:build:debug`

### MCP Server (`apps/mcp-server`)
- **Start Server**: `npm --workspace @prompt-repository/mcp-server run start`
- **Create MCP Bundle**: `npm run mcp:bundle` (generates a `.mcpb` asset for distribution)

---

## Architecture and Conventions

### Mobile Application
- **State Management**: Primary application state is managed in `App.jsx` using React hooks. Persistence is handled via `@capacitor/preferences` and synchronized with GitHub Gists.
- **Styling**: strictly use **Tailwind CSS**. Avoid CSS-in-JS unless necessary for dynamic native constraints.
- **Icons**: Use **Lucide React**.
- **Internal Updates**: The Android app supports seamless internal APK updates via a background download and native installation prompt (implemented using `@capacitor/file-transfer` and `@capawesome-team/capacitor-file-opener`).

### MCP Server
- **Protocol**: Adheres to the Model Context Protocol (stdio transport).
- **Tooling**: Exposes tools for searching prompts, creating prompt packs, and syncing repository metadata.

### Development Workflow
- **Surgical Edits**: When modifying `App.jsx` (which is large), prioritize the `replace` tool to minimize context usage.
- **Native Changes**: When adding Capacitor plugins, ensure you update the native configuration files:
    - Android: `AndroidManifest.xml` and `file_paths.xml`.
    - iOS: `App/App/Info.plist` (if applicable).
- **Testing**: Use Playwright for viewport/UI testing in the mobile app (`npm run test:viewport`).

---

## Directory Structure

```text
/
├── apps/
│   ├── mobile/       # React + Capacitor Mobile App
│   └── mcp-server/   # Node.js MCP Server
├── skills/
│   └── prompt-repository/ # Agent skill and templates
├── docs/             # Implementation plans and walkthroughs
└── packages/         # Shared logic (if any)
```
