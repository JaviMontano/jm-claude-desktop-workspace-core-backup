# System Map

```mermaid
flowchart LR
    A["Source Seed Repo"] --> B["JM Core Repo"]
    B --> C["Workspace Instance"]
    B --> D["Antigravity Export"]
    B --> E["Shared Sync"]
    C --> F["local/profiles (git-ignored)"]
    C --> G[".remember + workspaces (git-ignored)"]
    B --> H["assets / skills / agents"]
    B --> I["profiles / contracts / scripts / tests"]
```

## Reading Guide

- `JM Core Repo` is the only canonical source of reusable runtime.
- `Workspace Instance` is the operator-facing runtime and may carry local state.
- `local/profiles` and working memory are intentionally outside the sync and export boundary.
- `Antigravity Export` carries portable artifacts only.
- `Shared Sync` is narrower than the workspace and must remain allowlist-only.
