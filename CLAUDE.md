# JM Labs Master Claude Desktop Workspace

This repository is the canonical core for the JM Labs Claude Desktop environment.

## Startup

1. Read `profiles/capabilities/capability-manifest.json`.
2. Treat `profiles/desktop/claude_desktop_config.template.json` as the desktop truth contract.
3. Load runtime assets lazily from `_index-*`, `_flows/`, `_scripts/`, and `_templates/`.
4. Keep domain packs opt-in from `packs/`.
5. Never write secrets or operator auth state into git-tracked files.

## Canonical Rules

- Claude Desktop is the source environment.
- `playwright`, `notebooklm`, and `tessl` are required desktop MCPs.
- GitHub, Gmail, Google Drive, and Google Calendar are required Codex-side connectors.
- NotebookLM is exposed as a first-class capability with MCP-primary, skill-secondary execution.
- The workspace instance may carry local overlays and state; this core may not.

## Delivery Boundaries

- Reusable runtime belongs here.
- Local state belongs in the workspace instance repo.
- Shared sync is allowlist-only.
- Antigravity export must never mutate core files.

