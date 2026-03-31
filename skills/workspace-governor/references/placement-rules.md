# Placement Rules

## Put It In The Core When

- Another workspace should be able to reuse it unchanged.
- It defines policy, contracts, or portable structure.
- It is needed to bootstrap, refresh, validate, export, or sync safely.

## Put It In The Workspace When

- It records operator-facing activity or verification history.
- It is specific to the active machine or current working session.
- It improves local usability but should not become the canonical source.

## Keep It Ignored When

- It contains secrets, tokens, cookies, or auth residue.
- It is regenerated from live local state.
- It is a volatile report, active workspace, or memory cache.
