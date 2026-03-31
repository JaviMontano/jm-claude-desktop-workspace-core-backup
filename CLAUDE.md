# JM Labs Master Claude Desktop Workspace

This repository is the canonical core for the JM Labs Claude Desktop environment.

## Startup Order

1. Read `profiles/capabilities/capability-manifest.json` for the current capability contract.
2. Treat `profiles/desktop/claude_desktop_config.template.json` as the desktop runtime truth source.
3. If the task touches sync, export, or portability, read `contracts/shared-sync-allowlist.json` and `adapters/antigravity/README.md`.
4. If the task touches NotebookLM behavior, read `contracts/notebook-capability.schema.json`.
5. Load runtime assets lazily from `_index-*`, `_flows/`, `_scripts/`, and `_templates/`.
6. Keep `packs/` opt-in and never let them redefine the core.

## Placement Rules

- Put reusable runtime, contracts, portable assets, skills, and agent definitions in the core.
- Put machine-local overlays, auth state, memories, and active workspaces only in the workspace instance.
- Put nothing secret in tracked files, even if the value appears harmless or temporary.
- Do not store client outputs, proposal drafts, or session residue in the core.

## Canonical Runtime Rules

- Claude Desktop is the source environment.
- `playwright`, `notebooklm`, and `tessl` are required desktop MCPs.
- GitHub, Gmail, Google Drive, and Google Calendar are required Codex-side connectors.
- NotebookLM is a first-class capability with MCP-primary, skill-secondary execution.
- Repo-local `skills/` and `agents/` are portable source artifacts, not substitutes for desktop runtime.

## Change Discipline

- Prefer changing scripts, tests, and docs together when behavior changes.
- Expand machine-consumed config only when the added field improves validation or discoverability without harming runtime use.
- When a new artifact is meant to survive sync or export, update the allowlist and the export path in the same change.
- Preserve the workspace README and operator logs as instance-owned files.

## Definition Of Done

- The change preserves desktop-first semantics.
- The placement boundary between core, workspace, and ignored local state remains explicit.
- `sh scripts/doctor.sh` and `python3 -m unittest discover -s tests` pass.
- Any new portable surface is reflected in docs, contracts, and tests.
