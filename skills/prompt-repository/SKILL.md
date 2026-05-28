---
name: prompt-repository
description: Help users search, evaluate, organize, package, install, and publish reusable prompts, prompt packs, Codex skills, and agent-facing workflow assets. Use when working with prompt repository structure, skills.sh publishing, local skill installation, prompt metadata, templates, MCP-backed prompt tooling, or marketplace-ready agent capability packages.
---

# Prompt Repository

## Overview

Use this skill to turn reusable prompt and agent workflow ideas into installable local assets. Prefer a skill-first package when the user wants low-friction distribution through `skills.sh` and `npx skills add`, and add hosted services only for shared state, search indexes, accounts, analytics, private sync, or other live features.

## Core Workflow

1. Identify the artifact type: prompt, prompt pack, Codex skill, MCP server, hosted service, or a hybrid.
2. Keep the install surface local-first when possible: `skills/<name>/SKILL.md` plus optional `references/`, `scripts/`, and `assets/`.
3. Put activation rules in `SKILL.md` frontmatter `description`; put detailed procedure in the body or linked references.
4. Use `references/` for information the agent should load only when needed.
5. Use `assets/` for templates or files the agent can copy into outputs.
6. Validate skill folders before considering the package ready.
7. Document the install command for users:

```bash
npx skills add <owner>/<repo> --skill <skill-name>
```

## Package Decisions

- Use a Codex skill for instructions, workflows, local scripts, prompt templates, and repository conventions.
- Use an MCP server when the agent needs callable tools or structured access to local/remote data.
- Use a hosted API when the feature needs shared state, authentication, centralized search, telemetry, or paid service access.
- Use a hybrid when a local skill should teach the agent when to call an MCP server or hosted API.

## MCP Bootstrap

When this skill is running in a terminal-capable agent and needs Prompt Repository MCP tools, first check whether the MCP server is already available by calling `health` if the client exposes MCP tools. If the server is unavailable and the task would benefit from MCP, ask for explicit user approval before downloading anything.

After approval, read `references/mcp-install.md` and use `scripts/download-mcp-bundle.mjs` to download the latest GitHub Release `.mcpb` asset. Treat the MCP bundle as terminal-agent tooling only. Do not describe or attempt GUI drag-and-drop installation, and do not silently modify client configuration.

## Repository Layout

Prefer this layout for monorepos:

```text
skills/
  prompt-repository/
    SKILL.md
    agents/openai.yaml
    references/
    assets/
apps/
packages/
services/
```

Keep installable skills close to the repository root so users and marketplace crawlers can find them easily.

## References

- Read `references/workflow.md` when designing or publishing a prompt pack or skill-first package.
- Read `references/schema.md` when creating metadata for prompts, packs, or skills.
- Read `references/mcp-tools.md` when an MCP-capable client has the Prompt Repository MCP server installed.
- Read `references/mcp-install.md` when the MCP server is missing and the user approves downloading the MCP bundle.
- Use `assets/prompt-pack-template.md` as a starter file when the user wants a reusable prompt pack artifact.
