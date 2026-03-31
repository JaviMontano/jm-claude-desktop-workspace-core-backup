#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
WORKSPACE_ROOT=${JM_WORKSPACE_ROOT:-"$PROJECT_ROOT"}

node "$WORKSPACE_ROOT/admin-app/lib/cli.mjs" open --workspace-root "$WORKSPACE_ROOT" "$@"
