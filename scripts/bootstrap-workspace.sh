#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
CORE_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
WORKSPACE_ROOT=${1:-"$HOME/jm-claude-desktop-workspace"}
BOOTSTRAP_INCLUDE_PACKS=${BOOTSTRAP_INCLUDE_PACKS:-0}

case "$WORKSPACE_ROOT" in
  /*) ;;
  *)
    echo "usage: bootstrap-workspace.sh /absolute/path/to/workspace-instance"
    exit 1
    ;;
esac

if [ "$WORKSPACE_ROOT" = "$CORE_ROOT" ]; then
  echo "Refusing to bootstrap the workspace into the core repository."
  exit 1
fi

echo "Bootstrapping workspace at: $WORKSPACE_ROOT"

mkdir -p \
  "$WORKSPACE_ROOT/.remember" \
  "$WORKSPACE_ROOT/local" \
  "$WORKSPACE_ROOT/workspaces" \
  "$WORKSPACE_ROOT/local/profiles/claude" \
  "$WORKSPACE_ROOT/local/profiles/desktop" \
  "$WORKSPACE_ROOT/local/profiles/codex"

if [ ! -f "$WORKSPACE_ROOT/.gitignore" ]; then
  cat > "$WORKSPACE_ROOT/.gitignore" <<'EOF'
session-state.json
.remember/**
workspaces/**
local/profiles/**
.env
.env.*
*.local
adapters/antigravity/output/
reports/
EOF
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

if [ "$BOOTSTRAP_INCLUDE_PACKS" = "1" ] && [ -e "$CORE_ROOT/packs" ]; then
  rsync -a "$CORE_ROOT/packs" "$WORKSPACE_ROOT/"
fi

if [ ! -f "$WORKSPACE_ROOT/README.md" ]; then
  cat > "$WORKSPACE_ROOT/README.md" <<EOF
# JM Labs Claude Desktop Workspace

Local operator workspace bootstrapped from \`${CORE_ROOT##*/}\`.

- Core source: \`$CORE_ROOT\`
- Refresh from core: \`sh scripts/refresh-from-core.sh $CORE_ROOT\`
- Re-capture local overlays: \`sh scripts/capture-local-profiles.sh $WORKSPACE_ROOT\`
- Validate end to end: \`sh scripts/doctor.sh\`
EOF
fi

if [ ! -f "$WORKSPACE_ROOT/session-state.json" ]; then
  cp "$CORE_ROOT/session-state.template.json" "$WORKSPACE_ROOT/session-state.json"
fi

if [ ! -f "$WORKSPACE_ROOT/tasklog.md" ]; then
  cat > "$WORKSPACE_ROOT/tasklog.md" <<'EOF'
# Task Log

- Workspace bootstrapped from the canonical core.
EOF
fi

if [ ! -f "$WORKSPACE_ROOT/changelog.md" ]; then
  cat > "$WORKSPACE_ROOT/changelog.md" <<'EOF'
# Changelog

## Unreleased

- Workspace bootstrapped from the canonical core.
EOF
fi

if [ ! -f "$WORKSPACE_ROOT/decision-log.md" ]; then
  cat > "$WORKSPACE_ROOT/decision-log.md" <<'EOF'
# Decision Log

- Claude Desktop remains the canonical runtime.
- Local overlays remain git-ignored.
EOF
fi

if [ ! -f "$WORKSPACE_ROOT/QA-PLAN.md" ]; then
  cat > "$WORKSPACE_ROOT/QA-PLAN.md" <<'EOF'
# QA Plan

1. Run `sh scripts/check-capabilities.sh`.
2. Run `python3 -m unittest discover -s tests`.
3. Run `sh scripts/export-antigravity.sh`.
4. Run `sh scripts/sync-shared.sh /tmp/jm-shared-sync-check`.
EOF
fi

if [ -f "$WORKSPACE_ROOT/scripts/capture-local-profiles.sh" ]; then
  sh "$WORKSPACE_ROOT/scripts/capture-local-profiles.sh" "$WORKSPACE_ROOT"
fi

echo "Workspace bootstrap complete."
