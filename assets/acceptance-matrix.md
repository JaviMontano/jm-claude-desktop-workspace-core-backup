# Acceptance Matrix

| Surface | Must Be True | Primary Evidence | Failure Signal |
| --- | --- | --- | --- |
| Bootstrap | Creates a usable workspace without manual file creation | `sh scripts/bootstrap-workspace.sh ...` | Missing docs, scripts, or local snapshot folders |
| Profile Capture | Copies the four local profile snapshots or fails clearly | `sh scripts/capture-local-profiles.sh ...` | Silent partial capture |
| Runtime Readiness | Desktop MCPs, Codex connectors, and required binaries are present | `sh scripts/check-capabilities.sh` | Missing MCP markers, plugins, or executables |
| End-to-End Health | Validation runs from one entrypoint | `sh scripts/doctor.sh` | Manual multi-step recovery needed |
| Refresh Safety | Workspace updates from core without unsafe overwrite drift | `sh scripts/refresh-from-core.sh ...` | Dirty tree overwritten or core/workspace confusion |
| Shared Sync | Only allowed files copy; denied files block the run | `sh scripts/sync-shared.sh ...` | Silent leakage of local or generated content |
| Portable Export | Portable view contains portable artifacts and explicit compatibility metadata | `sh scripts/export-antigravity.sh` | Desktop-only semantics implied as portable |
| Pack Isolation | Optional packs remain available without defining the core identity | Repo structure + docs | Core breaks when packs are absent |
