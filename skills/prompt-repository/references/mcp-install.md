# MCP Bundle Install Bootstrap

Use this flow only when a terminal-capable AI agent needs Prompt Repository MCP tools and the Prompt Repository MCP server is not available in the current terminal/agent environment.

## Approval Prompt

Ask the user for explicit approval before downloading or installing the MCP bundle:

```text
The Prompt Repository MCP bundle is not installed or is not reachable in this terminal agent environment. I can download the latest bundle from the GitHub Release for <owner>/<repo>. Do you approve?
```

If the user approves, download the bundle. If the user declines, continue without MCP tools and explain which actions will be manual or less reliable.

## Download Command

From the installed skill directory, run:

```bash
node scripts/download-mcp-bundle.mjs <owner> <repo>
```

Optional flags:

```bash
node scripts/download-mcp-bundle.mjs <owner> <repo> --tag mcp-v0.3.0 --output ~/Downloads
```

The script downloads the first `.mcpb` release asset from the latest GitHub Release, or from the release tag supplied with `--tag`.

## Client Import

After download, tell the user where the `.mcpb` file was saved and report the terminal-oriented next step for the specific agent environment if it is known.

Do not assume a universal install command exists. Do not provide GUI, drag-and-drop, or desktop-client import instructions from this skill. If the current terminal agent exposes a documented MCP registration command or config file, ask for approval before using it.

## After Import

Once the bundle is registered in the terminal agent environment, check `health` again. If `health` works, use the MCP tools normally. If it still fails, continue without MCP and report that the bundle was downloaded but the tools are not exposed in the current session.
