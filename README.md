# JM Labs Master Claude Desktop Workspace Core

Canonical runtime for the JM Labs Claude Desktop environment.

This repository separates reusable runtime from local operator state. It is the source of truth for:

- Claude Desktop runtime assets
- Desktop, Claude, and Codex profile templates
- Contracts for capabilities and shared sync
- Optional domain packs
- Antigravity export logic

## Structure

- `CLAUDE.md`: core operating guide
- `_flows`, `_scripts`, `_templates`, `_index-*`: reusable ACC runtime extracted from the source workspace
- `profiles/`: desktop, Claude, Codex, and capability templates
- `contracts/`: machine-readable rules for sync and Notebook capability
- `packs/`: optional domain packs, currently seeded with the MetodologIA proposal engine
- `scripts/`: bootstrap, validation, export, and sync helpers
- `references/`: external inventory and source references
- `specs/001-master-claude-desktop-workspace/`: SDD track for this buildout
- `tests/`: repository contract tests

## Quick Start

1. Run `sh scripts/bootstrap-workspace.sh /absolute/path/to/workspace-instance`.
   Optional: set `BOOTSTRAP_INCLUDE_PACKS=1` to seed the optional domain packs into the target workspace.
2. Review or update local snapshots inside the target workspace under `local/profiles/`.
3. Run `scripts/check-capabilities.sh`.
4. Run `python3 -m unittest discover -s tests`.
5. When needed, export the portable view with `sh scripts/export-antigravity.sh`.

## Design Rules

- Claude Desktop is canonical.
- Antigravity is a derived compatibility layer.
- Secrets and operator auth never belong in git.
- Domain packs stay optional and isolated from the core runtime.
