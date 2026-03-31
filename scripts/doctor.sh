#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
DOCTOR_CAPTURE_PROFILES=${DOCTOR_CAPTURE_PROFILES:-0}
KEEP_DOCTOR_TMP=${KEEP_DOCTOR_TMP:-0}

EXPORT_ROOT=$(mktemp -d "${TMPDIR:-/tmp}/jm-antigravity.XXXXXX")
SYNC_ROOT=$(mktemp -d "${TMPDIR:-/tmp}/jm-shared-sync.XXXXXX")

cleanup() {
  if [ "$KEEP_DOCTOR_TMP" = "1" ]; then
    echo "Doctor artifacts preserved:"
    echo "  export=$EXPORT_ROOT"
    echo "  sync=$SYNC_ROOT"
  else
    rm -rf "$EXPORT_ROOT" "$SYNC_ROOT"
  fi
}

trap cleanup EXIT INT TERM

MODE=core
if [ -d "$PROJECT_ROOT/local/profiles" ]; then
  MODE=workspace
fi

echo "Doctor mode: $MODE"

if [ "$MODE" = "workspace" ] && [ "$DOCTOR_CAPTURE_PROFILES" = "1" ] && [ -f "$PROJECT_ROOT/scripts/capture-local-profiles.sh" ]; then
  sh "$PROJECT_ROOT/scripts/capture-local-profiles.sh" "$PROJECT_ROOT"
fi

if [ "$MODE" = "workspace" ]; then
  CHECK_SNAPSHOTS_ROOT="$PROJECT_ROOT" sh "$PROJECT_ROOT/scripts/check-capabilities.sh"
else
  sh "$PROJECT_ROOT/scripts/check-capabilities.sh"
fi

(
  cd "$PROJECT_ROOT"
  python3 -m unittest discover -s tests
)

sh "$PROJECT_ROOT/scripts/export-antigravity.sh" "$EXPORT_ROOT"
sh "$PROJECT_ROOT/scripts/sync-shared.sh" "$SYNC_ROOT"

echo "Doctor completed successfully."
