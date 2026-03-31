---
name: admin-dashboard-operator
description: Operate the JM Labs local admin dashboard and its repair surface. Use whenever the task mentions `dashboard.html`, `admin-app`, `dashboard-doctor.sh`, `dashboard-repair.sh`, the local mini app server, task admin views, filesystem inspection, or safe MCP/config visibility.
---

# Admin Dashboard Operator

Use this skill to inspect, validate, and repair the local task admin surface.

## First reads

1. Read `/Users/deonto/jm-claude-desktop-workspace-core/admin-app/server.mjs`.
2. Read `/Users/deonto/jm-claude-desktop-workspace-core/admin-app/lib/store.mjs`.
3. Read `/Users/deonto/jm-claude-desktop-workspace-core/CLAUDE.md`.

## Operating workflow

1. Verify the dashboard source files exist.
2. Verify indexes, `tasklog.md`, and dashboard snapshot are in sync.
3. Expose only safe config summaries, never secrets.
4. Prefer `dashboard-doctor.sh` first; use `dashboard-repair.sh` only when a
   repair is needed.
5. Confirm the UI still represents open, pending, done, filesystem, and config
   state from disk.

## Output format

```text
Dashboard status: <pass | degraded | fail>
Observed issue: <what is broken or confirmed>
Repair path: <script or file to run/change>
Verification: <doctor, server, or UI evidence>
```

## Hard boundaries

- Do not expose secret values in dashboard payloads.
- Do not confuse source files under `admin-app/` with generated snapshots under
  `local/`.
- Do not declare the dashboard healthy if the doctor path fails.
