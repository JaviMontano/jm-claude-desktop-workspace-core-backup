# Retrospective

## Iteration 1 Findings

1. The initial bootstrap created a usable workspace, but it did not carry all operational scripts and validation artifacts.
2. The first test suite assumed `tomllib`, which broke on the local Python 3.9 runtime.
3. The first capability check treated Codex plugin markers as regex, which broke literal matching.
4. The first refresh flow could overwrite workspace-specific files and create path drift inside the instance repo.
5. The initial shared sync logic skipped denylisted files instead of failing hard on policy violations.
6. The system remained technically sound but too thin in discoverability; several decisions existed only implicitly in code or earlier conversation context.

## Systemic Changes Applied

1. The bootstrap now seeds a protective `.gitignore`, copies a complete operational payload, preserves an existing instance README, and makes packs opt-in instead of mandatory.
2. Repository tests now validate the Codex template by string contract instead of Python-version-specific TOML parsing.
3. Capability checks now use literal matching.
4. The workspace refresh now refuses to run on a dirty tree unless forced and syncs the full `scripts/` directory without creating root-level duplicates.
5. Shared sync now fails hard on denylisted files instead of silently skipping them.
6. Canonical docs, specs, and contracts now expose acceptance gates, limits, edge cases, and trade-offs directly instead of relying on oral context.
7. The core now carries repo-local skills, agents, and compact architecture assets so the system is more self-sufficient without turning machine configs into verbose documents.

## Iteration 2 Validation Goal

- Refresh the workspace from the hardened core.
- Rerun tests.
- Rerun capability checks.
- Rerun Antigravity export.
- Rerun shared sync preview.

If all five pass, the baseline is considered frozen for this cycle.
