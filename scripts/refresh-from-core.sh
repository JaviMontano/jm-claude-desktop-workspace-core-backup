#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
WORKSPACE_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
CORE_ROOT=${1:-"$HOME/jm-claude-desktop-workspace-core"}
FORCE_REFRESH=${FORCE_REFRESH:-0}
REFRESH_INCLUDE_PACKS=${REFRESH_INCLUDE_PACKS:-1}
REFRESH_CAPTURE_PROFILES=${REFRESH_CAPTURE_PROFILES:-0}

if [ ! -d "$CORE_ROOT" ]; then
  echo "Missing core root: $CORE_ROOT"
  exit 1
fi

CORE_ROOT=$(CDPATH= cd -- "$CORE_ROOT" && pwd)

if [ "$CORE_ROOT" = "$WORKSPACE_ROOT" ]; then
  echo "Refusing to refresh a workspace from itself."
  exit 1
fi

if [ ! -f "$CORE_ROOT/CLAUDE.md" ] || [ ! -d "$CORE_ROOT/scripts" ]; then
  echo "The source path does not look like a JM Labs core repository: $CORE_ROOT"
  exit 1
fi

echo "Refreshing workspace from core: $CORE_ROOT"

if [ "$FORCE_REFRESH" != "1" ] && command -v git >/dev/null 2>&1; then
  if [ -n "$(git -C "$WORKSPACE_ROOT" status --short)" ]; then
    echo "Refusing refresh on a dirty workspace. Commit, stash, or set FORCE_REFRESH=1."
    exit 1
  fi
fi

for item in \
  CLAUDE.md \
  CONSTITUTION.md \
  _flows \
  _scripts \
  _templates \
  _index-agents.md \
  _index-commands.md \
  _index-routing.md \
  _index-skills.md \
  _index-workflows.md \
  _versions.md \
  session-state.template.json \
  profiles \
  contracts \
  references \
  assets \
  admin-app \
  skills \
  agents \
  scripts \
  tests \
  specs \
  adapters
do
  if [ -e "$CORE_ROOT/$item" ]; then
    rsync -a "$CORE_ROOT/$item" "$WORKSPACE_ROOT/"
  fi
done

if [ "$REFRESH_INCLUDE_PACKS" = "1" ] && [ -e "$CORE_ROOT/packs" ]; then
  rsync -a "$CORE_ROOT/packs" "$WORKSPACE_ROOT/"
fi

rm -f \
  "$WORKSPACE_ROOT/check-capabilities.sh" \
  "$WORKSPACE_ROOT/export-antigravity.sh" \
  "$WORKSPACE_ROOT/sync-shared.sh"

if [ "$REFRESH_CAPTURE_PROFILES" = "1" ] && [ -f "$WORKSPACE_ROOT/scripts/capture-local-profiles.sh" ]; then
  sh "$WORKSPACE_ROOT/scripts/capture-local-profiles.sh" "$WORKSPACE_ROOT"
fi

if [ -f "$WORKSPACE_ROOT/scripts/init-task-orchestrator.sh" ]; then
  sh "$WORKSPACE_ROOT/scripts/init-task-orchestrator.sh" "$WORKSPACE_ROOT"
fi

echo "Workspace refresh complete."
