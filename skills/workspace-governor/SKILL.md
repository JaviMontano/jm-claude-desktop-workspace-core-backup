---
name: workspace-governor
description: Govern changes to the JM Labs Claude Desktop workspace ecosystem. Use whenever a task touches bootstrap, refresh, sync, export, local overlays, repo-local skills or agents, `workspaces/tasks`, generated `tasklog.md`, task intake flows, or when you need to decide whether an artifact belongs in the core, the workspace instance, or ignored local state.
---

# Workspace Governor

Use this skill to keep the JM Labs workspace system coherent while it evolves.

## First Reads

1. Read `references/placement-rules.md`.
2. Read `/Users/deonto/jm-claude-desktop-workspace-core/profiles/capabilities/capability-manifest.json`.
3. If the task touches portability or downstream sharing, read `/Users/deonto/jm-claude-desktop-workspace-core/contracts/shared-sync-allowlist.json`.
4. If the task touches task memory, read `/Users/deonto/jm-claude-desktop-workspace-core/CLAUDE.md` for the task orchestration protocol.

## Core Decision

Classify every proposed artifact into exactly one destination:

- `core`: reusable runtime, contracts, assets, skills, agents, tests, portable docs.
- `workspace`: instance-owned docs, operator workflow logs, local operation wrappers.
- `ignored local state`: auth, overlays, `workspaces/tasks/**`, generated `tasklog.md`, active workspaces, generated reports, local dashboard snapshots.

If an artifact seems to belong in two places, the default answer is that the reusable part belongs in the core and the instance-specific part belongs in the workspace.

## Change Workflow

1. Read before writing.
2. State the artifact destination and why it belongs there.
3. If the artifact should survive refresh, sync, or export, update the corresponding script or contract in the same change.
4. If the artifact affects readiness, add or update a validation path.
5. Reject any change that widens the secret boundary or blurs core versus instance ownership.

## Output Format

When asked for analysis or a recommendation, use this structure:

```text
Decision: <core | workspace | ignored-local-state>
Why: <one short paragraph>
Required changes: <files or scripts to update>
Verification: <commands or checks>
```

## Hard Boundaries

- Do not store secrets or live auth in tracked files.
- Do not move workspace-owned logs into the core.
- Do not treat `workspaces/tasks/**` or generated `tasklog.md` as portable or syncable content.
- Do not mark a capability as portable if it depends on a desktop-only binding.
