# Spec

## Goal

Create a canonical JM Labs Claude Desktop workspace core that can bootstrap a local operator workspace, preserve desktop MCP parity, and export a portable Antigravity view.

## Success Criteria

- Core and workspace are separate repositories.
- Claude Desktop parity is modeled from the real desktop config.
- NotebookLM, Tessl, and Playwright are first-class desktop capabilities.
- GitHub, Gmail, Google Drive, and Google Calendar are modeled as required Codex connectors.
- Shared sync is allowlist-only.
- Tests validate the repository contracts.

## In Scope

- Runtime extraction from the source workspace
- Core/profile/contracts/scripts/tests
- Workspace bootstrap and local profile snapshots
- Antigravity adapter and compatibility report

## Out of Scope

- Multi-user account switching
- Public OSS packaging
- Replacing upstream auth mechanisms

