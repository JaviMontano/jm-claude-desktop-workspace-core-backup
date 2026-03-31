# Parity Checklist

## Required Desktop MCPs

- `playwright`
- `notebooklm`
- `tessl`

## Required Codex Connectors

- GitHub
- Gmail
- Google Drive
- Google Calendar

## Minimum Validation Path

1. Run `sh scripts/check-capabilities.sh`.
2. If auditing a workspace instance, run `CHECK_SNAPSHOTS_ROOT=<workspace-root> sh scripts/check-capabilities.sh`.
3. If claiming full readiness, run `sh scripts/doctor.sh`.
