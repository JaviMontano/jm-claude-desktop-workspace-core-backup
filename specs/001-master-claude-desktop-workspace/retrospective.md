# Retrospective

## Iteration 1 Findings

1. The initial bootstrap created a usable workspace, but it did not carry all operational scripts and validation artifacts.
2. The first test suite assumed `tomllib`, which broke on the local Python 3.9 runtime.
3. The first capability check treated Codex plugin markers as regex, which broke literal matching.

## Systemic Changes Applied

1. The bootstrap now copies `README.md`, `scripts`, `tests`, `specs`, and `adapters`, so future instances are complete by default.
2. Repository tests now validate the Codex template by string contract instead of Python-version-specific TOML parsing.
3. Capability checks now use literal matching, and shared sync now applies denylist filtering per file instead of copying directories blindly.

## Iteration 2 Validation Goal

- Refresh the workspace from the hardened core.
- Rerun tests.
- Rerun capability checks.
- Rerun Antigravity export.

If all four pass, the baseline is considered frozen for this cycle.
