# Prompt Repository Workflow

## Choose the Distribution Model

Use a local skill when the deliverable is mostly instructions, reusable prompts, workflow policy, examples, scripts, or templates. This gives users a short install command and keeps runtime private.

Use MCP when the agent needs callable functions, filesystem/database access, or structured tool responses. Keep the skill as the onboarding layer that explains when to use the MCP server.

Use remote hosting only for features that cannot be local-first: shared search indexes, accounts, permissions, private team catalogs, analytics, sync, billing, or centralized model/API access.

## Create a Skill-First Package

1. Pick a hyphen-case skill name under 64 characters.
2. Create `skills/<skill-name>/SKILL.md`.
3. Write frontmatter with only `name` and `description`.
4. Put trigger contexts in `description`, because it is the part visible before the skill loads.
5. Keep the body concise and procedural.
6. Move detailed schemas, long examples, or policy into `references/`.
7. Put starter prompt files and copyable boilerplate in `assets/`.
8. Add `agents/openai.yaml` for UI metadata when the environment supports it.
9. Validate the folder before publishing.

## Publish Through skills.sh

Host the repo publicly on GitHub. Users install with:

```bash
npx skills add <owner>/<repo> --skill <skill-name>
```

If the repo contains one skill, users may be able to install with:

```bash
npx skills add <owner>/<repo>
```

Use a root `skills.sh.json` to organize the marketplace page when the repo has multiple skills or when the default ordering is not clear.

## Prompt Pack Quality Bar

Prompt packs should include:

- A clear name and one-sentence purpose.
- Intended user requests that should trigger the pack.
- Required inputs and optional inputs.
- Output format expectations.
- Safety or privacy constraints.
- At least one concrete example.
- Version or compatibility notes when behavior depends on a specific agent, model, tool, or app.

## Local Agent Runtime

Installed skills are local capability bundles. The agent sees skill metadata, loads `SKILL.md` when the request matches, and reads referenced files only when needed. The skill should assume it can be used without a network connection unless it explicitly instructs the agent to call an MCP server or hosted API.
