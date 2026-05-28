# Prompt Repository MCP Tools

Use these tools when the Prompt Repository MCP server is installed in the user's client.

## Tools

- `health`: Confirm the MCP server is reachable.
- `search_prompts`: Search local prompt, prompt-pack, and skill files.
- `create_prompt_pack`: Create a Markdown prompt-pack file from structured inputs.
- `validate_prompt_pack`: Validate required prompt-pack frontmatter and recommended sections.
- `install_skill`: Generate the `npx skills add` command for a GitHub-hosted skill.
- `publish_manifest`: Create or replace a root `skills.sh.json` marketplace grouping manifest.
- `sync_repository`: Summarize local skill/MCP assets and return useful install or bundle commands.

## Usage Guidance

Prefer MCP tools for filesystem operations that should be consistent across agents, especially creating prompt packs and validating repository state.

Do not assume `install_skill` performs a network install. It returns the command users or agents can run with explicit approval.

Use `sync_repository` before publishing or release work to confirm these expected assets exist:

- `skills/prompt-repository/SKILL.md`
- `skills.sh.json`
- `apps/mcp-server/manifest.json`
- `apps/mcp-server/dist/prompt-repository-mcp-<version>.mcpb`
