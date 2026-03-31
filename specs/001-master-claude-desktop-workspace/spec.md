# Spec

## Goal

Create a canonical JM Labs Claude Desktop workspace core that can bootstrap a local operator workspace, preserve desktop MCP parity, orchestrate persistent task memory, and export a portable Antigravity view.

## Success Criteria

- Core and workspace are separate repositories.
- Claude Desktop parity is modeled from the real desktop config.
- NotebookLM, Tessl, and Playwright are first-class desktop capabilities.
- GitHub, Gmail, Google Drive, and Google Calendar are modeled as required Codex connectors.
- Every new work input can be resolved into `new`, `resume`, or `ambiguous` and written to recoverable task memory.
- A local admin dashboard can inspect open tasks, done history, filesystem state, and safe config summaries.
- Shared sync is allowlist-only.
- Tests validate the repository contracts.
- The system carries enough local scripts, assets, skills, and agents to be operable without prior chat context.

## In Scope

- Runtime extraction from the source workspace
- Core/profile/contracts/scripts/tests
- Compact architecture and acceptance assets
- Persistent task orchestration and local admin dashboard runtime
- Repo-local maintenance skills and review agents
- Workspace bootstrap and local profile snapshots
- Antigravity adapter and compatibility report

## Out of Scope

- Multi-user account switching
- Public OSS packaging
- Replacing upstream auth mechanisms

## Acceptance Criteria

- A new workspace can be bootstrapped with one command and without manual file creation.
- A refresh preserves instance-owned docs while updating shared operational surfaces.
- A doctor run can validate the installation in one path.
- A new input can be registered without manual task folder editing.
- Ambiguous inputs remain recoverable without contaminating an existing task.
- Shared sync and Antigravity export both expose explicit boundaries instead of silent omission.

## Edge Cases

- Missing local config files must fail clearly during profile capture unless the operator explicitly allows degradation.
- Dirty workspace state must block refresh unless forced.
- A done task resumed later must return to `open/` without losing prior `rag-memory-*`.
- A pending ambiguous intake must be promotable either to a new task or into an existing task.
- Portable export must not include files that require local desktop auth or preferences to make sense.
