# Constitution

## 1. Desktop-First Canon

Claude Desktop is the primary runtime. Any secondary environment must derive from this repository rather than redefining behavior independently.

## 2. Core vs Instance Separation

Reusable runtime, templates, contracts, and adapters belong in the core. Operator state, auth material, memories, and active workspaces belong only in the instance repository.

## 3. No Secrets in Git

Credentials, cookies, tokens, and other operator secrets must remain local and ignored. Templates may describe them; tracked files may not contain them.

## 4. Adapters, Not Forks

Portability layers such as Antigravity must be generated from the canonical core. They may degrade capabilities, but they may not become competing sources of truth.

## 5. Evidence Before Claim

Configuration parity, capability readiness, and sync safety must be verified by scripts or tests before they are asserted complete.

## 6. Optional Domain Packs

Business or methodology packs may extend the system, but they must remain optional and must not contaminate the core runtime or branding.

