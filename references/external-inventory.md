# External Inventory

This inventory tracks the external systems, upstreams, and local binaries that this workspace depends on.

| Item | Source | Purpose | Local Anchor | Notes |
| --- | --- | --- | --- | --- |
| Intent Integrity Chain / Kit | [intent-integrity-chain/kit](https://github.com/intent-integrity-chain/kit) | Upstream lineage for SDD / IIK workflow | `/Users/deonto/skills/plugins/sdd-metodologia` | Branded and absorbed locally in the SDD plugin |
| Claude Desktop MCP config | [Anthropic Claude Desktop](https://docs.anthropic.com) | Canonical desktop runtime profile | `/Users/deonto/Library/Application Support/Claude/claude_desktop_config.json` | Source of truth for desktop MCP parity |
| Tessl MCP | [Tessl](https://tessl.io/) | MCP-backed coding/runtime capability | `/Users/deonto/.local/bin/tessl` | Required desktop MCP |
| NotebookLM MCP | [NotebookLM](https://notebooklm.google.com/) | Source-grounded notebook querying | `/Users/deonto/.local/bin/notebooklm-mcp` | Primary Notebook capability path |
| Playwright MCP | [Playwright MCP package](https://www.npmjs.com/package/@playwright/mcp) | Browser automation capability | `npx @playwright/mcp@latest` | Required desktop and Codex-side browser support |
| GitHub app plugin | [GitHub Plugin](https://github.com/) | GitHub repository and PR workflows | Codex plugin `github@openai-curated` | Connector-first where available |
| Gmail app plugin | [Gmail](https://mail.google.com/) | Mailbox workflows | Codex plugin `gmail@openai-curated` | Same Google identity as Drive and NotebookLM |
| Google Drive app plugin | [Google Drive](https://drive.google.com/) | Docs, Sheets, Slides, and file workflows | Codex plugin `google-drive@openai-curated` | Primary Drive capability path |
| Google Calendar app plugin | [Google Calendar](https://calendar.google.com/) | Calendar and scheduling workflows | Codex plugin `google-calendar@openai-curated` | Same Google identity |
| NotebookLM skill wrapper | `/Users/deonto/.agents/skills/notebooklm/SKILL.md` | Secondary Notebook fallback and orchestration | Local skill | Use only as fallback or wrapper around MCP |

