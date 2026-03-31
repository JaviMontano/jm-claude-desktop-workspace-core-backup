# Analysis

The source repository mixes reusable runtime with proposal workspaces, session state, and business-specific outputs. That makes it useful as a seed source but weak as a canonical desktop baseline.

The real `claude_desktop_config.json` changes the design materially: NotebookLM is not merely a community skill or browser trick, but an actual configured desktop MCP alongside Playwright and Tessl. The canonical core therefore needs to treat desktop MCP parity as a first-class contract.

The local operator already has Google and GitHub powers active on the Codex side. The cleanest v1 is to preserve those powers as required connectors while keeping Claude Desktop canonical for desktop runtime and MCP execution.

