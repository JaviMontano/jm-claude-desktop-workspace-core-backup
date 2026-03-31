---
name: task-orchestration-governor
description: Govern the JM Labs persistent task filesystem and intake workflow. Use whenever the task mentions `workspaces/tasks`, `tasklog.md`, `rag-memory-*`, task intake, task close, task resume, ambiguous inputs, session-state orchestration, or the rule that every new work input must be recoverable from disk.
---

# Task Orchestration Governor

Use this skill to keep the task filesystem deterministic, recoverable, and
strictly local.

## First reads

1. Read `/Users/deonto/jm-claude-desktop-workspace-core/CLAUDE.md`.
2. Read `/Users/deonto/jm-claude-desktop-workspace-core/session-state.template.json`.
3. If the task touches portability, read `/Users/deonto/jm-claude-desktop-workspace-core/contracts/shared-sync-allowlist.json`.

## Governing rules

1. Route all task-local memory to `workspaces/tasks/`.
2. Keep `tasklog.md` generated and open-only.
3. Resolve every new input as `new`, `resume`, or `ambiguous`.
4. On ambiguity, preserve the input and stop for confirmation instead of mixing contexts.
5. Never close a task without explicit confirmation and completed DoD.

## Required checks

- Verify the contract files exist: `task.md`, `status.json`,
  `definition-of-done.md`, `conversation-log.md`, `rag-memory-*.md`.
- Verify `session-state.json` carries current task and ambiguity fields.
- Verify `workspaces/**` and `tasklog.md` remain local-only and ignored.

## Output format

```text
Resolution path: <new | resume | ambiguous | repair>
Files or scripts: <what must change or run>
Boundary check: <why this stays local or portable>
Verification: <commands or evidence>
```

## Hard boundaries

- Do not store task memory outside `workspaces/tasks/`.
- Do not hand-edit `tasklog.md` as a durable narrative log.
- Do not claim resolution quality if the intake path did not write a
  `rag-memory-*`.
