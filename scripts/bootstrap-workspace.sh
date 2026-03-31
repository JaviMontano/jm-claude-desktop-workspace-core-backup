#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
CORE_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
WORKSPACE_ROOT=${1:-"$HOME/jm-claude-desktop-workspace"}
BOOTSTRAP_INCLUDE_PACKS=${BOOTSTRAP_INCLUDE_PACKS:-0}

echo "Bootstrapping workspace at: $WORKSPACE_ROOT"

mkdir -p \
  "$WORKSPACE_ROOT/.remember" \
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
  cp "$CORE_ROOT/README.md" "$WORKSPACE_ROOT/README.md"
fi

if [ ! -f "$WORKSPACE_ROOT/session-state.json" ]; then
  cp "$CORE_ROOT/session-state.template.json" "$WORKSPACE_ROOT/session-state.json"
fi

for file in tasklog.md changelog.md decision-log.md QA-PLAN.md; do
  if [ ! -f "$WORKSPACE_ROOT/$file" ]; then
    : > "$WORKSPACE_ROOT/$file"
  fi
done

DESKTOP_CFG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
CLAUDE_SETTINGS="$HOME/.claude/settings.json"
CLAUDE_SETTINGS_LOCAL="$HOME/.claude/settings.local.json"
CODEX_CONFIG="$HOME/.codex/config.toml"

[ -f "$DESKTOP_CFG" ] && cp "$DESKTOP_CFG" "$WORKSPACE_ROOT/local/profiles/desktop/claude_desktop_config.json"
[ -f "$CLAUDE_SETTINGS" ] && cp "$CLAUDE_SETTINGS" "$WORKSPACE_ROOT/local/profiles/claude/settings.json"
[ -f "$CLAUDE_SETTINGS_LOCAL" ] && cp "$CLAUDE_SETTINGS_LOCAL" "$WORKSPACE_ROOT/local/profiles/claude/settings.local.json"
[ -f "$CODEX_CONFIG" ] && cp "$CODEX_CONFIG" "$WORKSPACE_ROOT/local/profiles/codex/config.toml"

echo "Workspace bootstrap complete."
