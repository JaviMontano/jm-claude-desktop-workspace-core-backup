# JM Labs Master Claude Desktop Workspace

This file governs the JM Labs Claude Desktop environment. In the core repo it is
the canonical source; in the workspace repo it remains the copied runtime
contract.

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

## Task Orchestration Protocol

- Treat `workspaces/tasks/` as the only valid home for task-local memories, recovered inputs, attachments, and artifacts.
- For every new work-oriented input in a workspace instance, follow this pipeline before editing delivery files: interpret input, resolve task, write `rag-memory-*`, sync indexes and `tasklog.md`, then continue execution.
- Resolve tasks deterministically with `new`, `resume`, or `ambiguous`; never auto-resume when multiple candidates remain close.
- On ambiguity, preserve the input in a pending task folder and ask for confirmation instead of blending contexts.
- Never close a task without explicit user confirmation and a completed `definition-of-done.md`.
- Keep `tasklog.md` generated and open-only; task history lives in `workspaces/tasks/done/`, not in a global narrative log.
- Keep `workspaces/**`, `session-state.json`, and generated dashboard snapshots local-only and out of sync/export surfaces.

## Change Discipline

- Prefer changing scripts, tests, and docs together when behavior changes.
- Expand machine-consumed config only when the added field improves validation or discoverability without harming runtime use.
- When a new artifact is meant to survive sync or export, update the allowlist and the export path in the same change.
- Preserve the workspace README and operator logs as instance-owned files.
- When a change affects task orchestration or the admin app, update the task scripts, `admin-app/`, docs, and tests in the same pass.

## Definition Of Done

- The change preserves desktop-first semantics.
- The placement boundary between core, workspace, and ignored local state remains explicit.
- `sh scripts/doctor.sh` and `python3 -m unittest discover -s tests` pass.
- Any new portable surface is reflected in docs, contracts, and tests.
- Workspace task intake, index sync, and dashboard doctor can run without manual file creation.
