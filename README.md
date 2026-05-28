# Prompt Repository

Prompt Repository is a Turborepo monorepo with two tools:

- `apps/mobile`: the Ionic/React + Capacitor mobile app.
- `apps/mcp-server`: a stdio MCP server for automation clients.

The mobile app is the user-facing prompt repository. It runs as a Vite web app during development and uses Capacitor to sync/build native Android and iOS projects.

The MCP server is a command-line process that reads JSON-RPC messages from stdin and writes responses to stdout. It currently exposes a `health` tool so MCP clients can verify that the server is installed and reachable.

## Workspaces

```text
apps/
  mobile/      Ionic + Capacitor app
  mcp-server/  stdio MCP server
```

## Install

Install dependencies from the repository root:

```bash
npm install
```

The root package uses npm workspaces, so this installs dependencies for both tools.

## Common Commands

```bash
npm run ci
```

Runs Turbo validation for every workspace. This builds the mobile web bundle and syntax-checks the MCP server.

```bash
npm run build
```

Runs Turbo build tasks for every workspace.

## Mobile App

Use the mobile app when you want to run, preview, or package the Prompt Repository UI.

Run the Vite dev server:

```bash
npm --workspace @prompt-repository/mobile run dev
```

Build the web bundle:

```bash
npm --workspace @prompt-repository/mobile run build
```

Preview the production web bundle:

```bash
npm run preview
```

Sync web assets into the Android Capacitor project:

```bash
npm run cap:sync
```

Build Android:

```bash
npm --workspace @prompt-repository/mobile run android:build:debug
npm --workspace @prompt-repository/mobile run android:build:release
```

Sync iOS:

```bash
npm run ios:sync
```

Build iOS simulator debug:

```bash
npm run ios:build:debug
```

Native Android builds require a compatible Android SDK and Java 17 or newer. The GitHub Android workflow configures Java 21.

## MCP Server

Use the MCP server when an MCP-compatible client needs to talk to this repository over stdio.

Start the server:

```bash
npm run mcp:start
```

Equivalent workspace command:

```bash
npm --workspace @prompt-repository/mcp-server run start
```

The server supports these JSON-RPC methods:

- `initialize`: returns server metadata and tool capabilities.
- `tools/list`: lists available tools.
- `tools/call`: runs a tool by name.

Available tools:

- `health`: returns a text response confirming that the MCP server is running.

Example smoke test:

```bash
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' \
  '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"health","arguments":{}}}' \
  | npm run --silent mcp:start
```

## CI and Releases

GitHub Actions run from the monorepo root, then delegate app-specific work to `apps/mobile`.

- Android release workflow installs dependencies, validates the monorepo, runs viewport tests, syncs Capacitor, and builds the APK from `apps/mobile`.
- iOS release workflows install dependencies, validate the monorepo, sync Capacitor from `apps/mobile`, and archive the Xcode workspace at `apps/mobile/ios/App/App.xcworkspace`.
