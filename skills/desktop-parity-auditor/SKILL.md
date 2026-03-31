---
name: desktop-parity-auditor
description: Audit parity between the JM Labs core contracts and the live Claude Desktop or Codex environment. Use whenever MCPs, plugins, connectors, local overlays, NotebookLM, Tessl, admin dashboard health, task orchestration scripts, or readiness claims are involved, especially before declaring the workspace healthy.
---

# Desktop Parity Auditor

Use this skill to detect drift between the intended environment and the live machine.

## First Reads

1. Read `references/checklist.md`.
2. Read `/Users/deonto/jm-claude-desktop-workspace-core/profiles/capabilities/capability-manifest.json`.
3. Read `/Users/deonto/jm-claude-desktop-workspace-core/profiles/desktop/claude_desktop_config.template.json`.
4. If the task touches task orchestration, read `/Users/deonto/jm-claude-desktop-workspace-core/CLAUDE.md`.

## Audit Workflow

1. Compare the live machine against the required desktop MCPs, Claude plugins, and Codex connectors.
2. Check whether local snapshots exist and still represent the same capability plane.
3. If the claim includes admin health or task orchestration, run `sh scripts/dashboard-doctor.sh` in the workspace.
4. Run the smallest validating command that proves the claim.
5. Separate hard failures from acceptable degradations.
6. Recommend the narrowest fix that restores parity.

## Output Format

```text
Parity status: <pass | degraded | fail>
Confirmed: <facts that matched>
Drift: <facts that did not match>
Fix path: <next commands or edits>
```

## Hard Boundaries

- Do not claim parity from templates alone; compare against the live machine.
- Do not treat a fallback skill as equivalent to a configured desktop MCP unless the report explicitly marks it as degraded.
- Do not treat a generated `tasklog.md` or dashboard snapshot as proof that task indexes are healthy; verify the doctor path.
- Do not hide missing binaries or connectors behind vague wording.
