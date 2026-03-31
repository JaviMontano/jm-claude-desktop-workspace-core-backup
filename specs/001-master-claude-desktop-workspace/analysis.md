# Analysis

The source repository mixes reusable runtime with proposal workspaces, session state, and business-specific outputs. That makes it useful as a seed source but weak as a canonical desktop baseline.

The real `claude_desktop_config.json` changes the design materially: NotebookLM is not merely a community skill or browser trick, but an actual configured desktop MCP alongside Playwright and Tessl. The canonical core therefore needs to treat desktop MCP parity as a first-class contract.

The local operator already has Google and GitHub powers active on the Codex side. The cleanest v1 is to preserve those powers as required connectors while keeping Claude Desktop canonical for desktop runtime and MCP execution.

## Implications

- Machine-consumed config templates should stay compact; robustness belongs mostly in contracts, scripts, tests, and surrounding docs.
- The workspace must be self-sufficient for operation, but it must not become a second source of truth.
- The system needs a clean distinction between portable source artifacts and desktop-only runtime bindings.

## Edge Constraints

- Local snapshots are useful only if they are ignored, refreshable, and never part of shared sync.
- Antigravity can export guidance, skills, agents, and references, but not live desktop posture.
- Optional domain packs add leverage only if the base workspace still works without them.
