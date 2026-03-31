# Antigravity Adapter

This directory contains the source-side contract for derived Antigravity exports.

## Purpose

Antigravity is a portability adapter, not a competing runtime. The export exists to carry portable artifacts, rules, and indexes into a secondary environment without claiming that Claude Desktop-only behavior is portable.

## What The Export Should Include

- Portable governance files and rules.
- References, contracts, and compact architecture assets.
- Repo-local skills and agents that remain valid as source artifacts.
- Optional pack skills that do not depend on local desktop bindings.

## What The Export Must Exclude

- Live operator auth material.
- Local overlays and snapshots.
- Claude Desktop preferences that only make sense on the source machine.
- Any artifact whose semantics depend on a desktop MCP being present.

## Acceptance Rule

`scripts/export-antigravity.sh` is acceptable only if it produces explicit compatibility metadata and keeps desktop-only capabilities labeled as degraded or unavailable.
