# Constitution

## 1. Desktop-First Canon

Claude Desktop is the primary runtime. Any secondary environment must derive from this repository rather than redefining behavior independently.

## 2. Core vs Instance Separation

Reusable runtime, templates, contracts, and adapters belong in the core. Operator state, auth material, memories, and active workspaces belong only in the instance repository.

## 3. No Secrets in Git

Credentials, cookies, tokens, and other operator secrets must remain local and ignored. Templates may describe them; tracked files may not contain them.

## 4. Allowlist-Only Shared Sync

Any shared sync must copy only explicitly allowed artifacts and must fail closed on denied paths. Convenience is never a reason to widen the trust boundary implicitly.

## 5. Adapters, Not Forks

Portability layers such as Antigravity must be generated from the canonical core. They may degrade capabilities, but they may not become competing sources of truth.

## 6. Evidence Before Claim

Configuration parity, capability readiness, and sync safety must be verified by scripts or tests before they are asserted complete.

## 7. Single Operator Until Redesigned

This baseline assumes one operator and one effective identity plane across Claude Desktop, Codex, GitHub, Google, and NotebookLM. Multi-user or multi-account support requires explicit redesign rather than accidental drift.

## 8. Optional Domain Packs

Business or methodology packs may extend the system, but they must remain optional and must not contaminate the core runtime or branding.

## 9. Discoverability Is Part Of The System

If a script, contract, skill, agent, or asset is required for safe operation, it must be referenced from the canonical documentation and covered by tests or validation checks.
