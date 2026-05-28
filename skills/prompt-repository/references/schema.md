# Prompt Asset Schema

Use this schema as a lightweight standard for reusable prompt assets and prompt packs. Keep fields simple enough to read in Markdown, JSON, or YAML.

## Prompt Asset

```yaml
id: review-react-component
name: Review React Component
version: 0.1.0
summary: Review a React component for correctness, accessibility, and maintainability.
triggers:
  - review this React component
  - check this frontend code
inputs:
  required:
    - source_code
  optional:
    - framework_version
    - design_system_notes
outputs:
  format: markdown
  sections:
    - findings
    - risks
    - suggested_changes
constraints:
  - Prefer specific file and line references.
  - Do not rewrite unrelated code.
compatibility:
  agents:
    - codex
  tools:
    - shell
```

## Prompt Pack

```yaml
id: frontend-review-pack
name: Frontend Review Pack
version: 0.1.0
summary: Reusable prompts for reviewing frontend implementation quality.
assets:
  - review-react-component
  - review-css-layout
  - review-accessibility
install:
  skill: prompt-repository
  command: npx skills add <owner>/<repo> --skill prompt-repository
```

## Field Guidance

- `id`: Stable hyphen-case identifier.
- `name`: Human-facing title.
- `version`: Semver-like version for user-facing changes.
- `summary`: One sentence, concrete enough for search results.
- `triggers`: User phrases or task contexts that should activate the asset.
- `inputs`: Data the agent needs before it can run the prompt well.
- `outputs`: Expected response structure.
- `constraints`: Behavioral rules, privacy limits, or quality standards.
- `compatibility`: Agent, tool, app, model, or environment assumptions.
