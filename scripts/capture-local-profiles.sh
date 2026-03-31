#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
DEFAULT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
WORKSPACE_ROOT=${1:-"$DEFAULT_ROOT"}
CAPTURE_ALLOW_MISSING=${CAPTURE_ALLOW_MISSING:-0}

DESKTOP_CFG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
CLAUDE_SETTINGS="$HOME/.claude/settings.json"
CLAUDE_SETTINGS_LOCAL="$HOME/.claude/settings.local.json"
CODEX_CONFIG="$HOME/.codex/config.toml"

mkdir -p \
  "$WORKSPACE_ROOT/local/profiles/desktop" \
  "$WORKSPACE_ROOT/local/profiles/claude" \
  "$WORKSPACE_ROOT/local/profiles/codex"

copy_required() {
  src=$1
  dest=$2
  label=$3

  if [ -f "$src" ]; then
    cp "$src" "$dest"
    echo "OK  capture: $label"
    return 0
  fi

  echo "MISS capture: $label ($src)"
  if [ "$CAPTURE_ALLOW_MISSING" = "1" ]; then
    return 0
  fi
  return 1
}

copy_required "$DESKTOP_CFG" "$WORKSPACE_ROOT/local/profiles/desktop/claude_desktop_config.json" "desktop"
copy_required "$CLAUDE_SETTINGS" "$WORKSPACE_ROOT/local/profiles/claude/settings.json" "claude settings"
copy_required "$CLAUDE_SETTINGS_LOCAL" "$WORKSPACE_ROOT/local/profiles/claude/settings.local.json" "claude local settings"
copy_required "$CODEX_CONFIG" "$WORKSPACE_ROOT/local/profiles/codex/config.toml" "codex config"

echo "Local profile capture complete."
