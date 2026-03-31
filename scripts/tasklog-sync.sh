#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
WORKSPACE_ROOT=${1:-"$PROJECT_ROOT"}

node "$WORKSPACE_ROOT/admin-app/lib/cli.mjs" sync-tasklog --workspace-root "$WORKSPACE_ROOT"
