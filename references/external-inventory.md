# External Inventory

This inventory tracks the external systems, upstreams, and local binaries that this workspace depends on.

| Item | Source | Role In This System | Auth / Trust Model | Local Anchor | Fallback / Limit |
| --- | --- | --- | --- | --- | --- |
| Intent Integrity Chain / Kit | [intent-integrity-chain/kit](https://github.com/intent-integrity-chain/kit) | Upstream lineage for SDD / IIK workflow and decision hygiene | No runtime auth here; conceptual lineage only | `/Users/deonto/skills/plugins/sdd-metodologia` | Informational upstream; local implementation can diverge deliberately |
| Claude Desktop MCP config | [Anthropic Claude Desktop](https://docs.anthropic.com) | Canonical desktop runtime profile and MCP parity source | Local desktop config, operator-owned | `/Users/deonto/Library/Application Support/Claude/claude_desktop_config.json` | Required for desktop truth; portable exports must not pretend to replace it |
| Tessl MCP | [Tessl](https://tessl.io/) | Coding/runtime capability in the desktop plane | Local executable plus operator auth if configured externally | `/Users/deonto/.local/bin/tessl` | Desktop-only binding; absence is a hard readiness failure |
| NotebookLM MCP | [NotebookLM](https://notebooklm.google.com/) | Primary source-grounded notebook capability | Local executable plus Google-backed session/auth | `/Users/deonto/.local/bin/notebooklm-mcp` | Skill wrapper exists, but it is secondary and may be less direct |
| Playwright MCP | [Playwright MCP package](https://www.npmjs.com/package/@playwright/mcp) | Browser automation across desktop and Codex-side flows | Local `npx` execution; no repo-stored secrets | `npx @playwright/mcp@latest` | Version drift is possible if upstream changes; doctor checks only presence and contract markers |
| GitHub app plugin | [GitHub](https://github.com/) | GitHub repository and PR workflows on the Codex side | Connector auth bound to the operator identity | Codex plugin `github@openai-curated` | Required connector; fallback is local git + `gh`, with lower semantic integration |
| Gmail app plugin | [Gmail](https://mail.google.com/) | Mailbox workflows and Google identity continuity | Connector auth bound to the operator Google account | Codex plugin `gmail@openai-curated` | Required for email-plane parity; no repo-stored auth allowed |
| Google Drive app plugin | [Google Drive](https://drive.google.com/) | Drive, Docs, Sheets, and Slides workflows | Same Google identity plane as Gmail and NotebookLM | Codex plugin `google-drive@openai-curated` | Primary document-plane connector |
| Google Calendar app plugin | [Google Calendar](https://calendar.google.com/) | Scheduling and availability workflows | Same Google identity plane as Gmail and Drive | Codex plugin `google-calendar@openai-curated` | Required connector for the current baseline |
| NotebookLM skill wrapper | `/Users/deonto/.agents/skills/notebooklm/SKILL.md` | Secondary Notebook fallback and orchestration wrapper | Local skill, no embedded tokens | Local skill | Use only when MCP is unavailable or when extra orchestration is needed |

## Inventory Rules

- If an external dependency becomes required for readiness, add it here before relying on it in docs or scripts.
- If a dependency is desktop-only or operator-auth-backed, say so explicitly.
- If a dependency has a safe fallback, document the degradation instead of implying parity.
