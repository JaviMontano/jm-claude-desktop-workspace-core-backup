# JM Labs Master Claude Desktop Workspace Core

Canonical runtime, contracts, and governance layer for the JM Labs Claude Desktop system.

## What This Repo Guarantees

- Reusable runtime is separated from operator-local state.
- Claude Desktop remains the canonical environment definition.
- NotebookLM, Tessl, and Playwright stay modeled as first-class desktop capabilities.
- Shared sync stays allowlist-only and fails closed on denied content.
- Antigravity export remains explicitly derived and cannot silently redefine desktop-only behavior.

## What This Repo Is Not

- Not a live operator workspace.
- Not a secret store.
- Not a multi-user control plane.
- Not a dumping ground for proposal outputs, session residue, or client-specific workspaces.

## Repository Map

- `CLAUDE.md`: operating contract for agents working on the core.
- `CONSTITUTION.md`: non-negotiable system rules and failure boundaries.
- `_flows`, `_scripts`, `_templates`, `_index-*`, `_versions.md`: extracted reusable runtime.
- `profiles/`: desktop, Claude, Codex, capability, and account templates.
- `contracts/`: sync policy and Notebook capability schema.
- `assets/`: compact architectural and acceptance artifacts for fast orientation.
- `admin-app/`: local-first admin mini app, static dashboard shell, and orchestration library.
- `skills/`: repo-local skills for governance and parity work.
- `agents/`: reusable agent definitions for architecture, profile auditing, and sync review.
- `packs/`: optional domain packs; core identity must not depend on them.
- `scripts/`: bootstrap, refresh, profile capture, doctor, validation, export, and sync helpers.
- `references/`: upstream inventory and source anchors.
- `specs/001-master-claude-desktop-workspace/`: SDD track with rationale, decisions, and validation intent.
- `tests/`: contract tests for the core surface.

## Operating Lifecycle

1. Bootstrap a workspace with `sh scripts/bootstrap-workspace.sh /absolute/path/to/workspace-instance`.
2. Capture or refresh live local overlays with `sh scripts/capture-local-profiles.sh /absolute/path/to/workspace-instance`.
3. Initialize the persistent task filesystem with `sh scripts/init-task-orchestrator.sh /absolute/path/to/workspace-instance`.
4. Register inputs with `sh scripts/task-intake.sh --text "..."` or launch the mini app with `sh scripts/dashboard-serve.sh`.
5. Run `sh scripts/doctor.sh` from the core or workspace root.
6. Export the portable view with `sh scripts/export-antigravity.sh`.
7. Sync curated artifacts downstream with `sh scripts/sync-shared.sh /absolute/path/to/target-repo`.

`BOOTSTRAP_INCLUDE_PACKS=1` keeps optional packs. `REFRESH_INCLUDE_PACKS=0` allows a workspace refresh without pack content. `DOCTOR_CAPTURE_PROFILES=1` lets the doctor refresh local snapshots before validating.

## Acceptance Gate

This baseline is acceptable only when all of the following are true:

- `python3 -m unittest discover -s tests` passes.
- `sh scripts/check-capabilities.sh` passes against the live machine.
- `sh scripts/doctor.sh` passes end to end.
- `sh scripts/dashboard-doctor.sh` passes in the workspace instance.
- The portable Antigravity export completes and generates compatibility metadata.
- Shared sync copies only allowlisted material and aborts on denied matches.

## Design Decisions

- Desktop-first: Claude Desktop defines runtime truth because the real environment already exposes required MCPs there.
- Core vs instance split: the core stays shareable; the workspace carries local overlays and working state.
- Local-first task memory: every work input becomes recoverable disk state under `workspaces/tasks/` without leaking into portable surfaces.
- Fail-closed sync: it is cheaper to stop a sync than to recover from leaked local state.
- Optional packs: MetodologIA and future business packs remain available without contaminating JM Labs core identity.
- Portable, not fake-portable: Antigravity receives only artifacts that remain valid outside Claude Desktop.
