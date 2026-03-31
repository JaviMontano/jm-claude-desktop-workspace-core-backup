#!/bin/sh
set -eu

DESKTOP_CFG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
CLAUDE_SETTINGS="$HOME/.claude/settings.json"
CLAUDE_SETTINGS_LOCAL="$HOME/.claude/settings.local.json"
CODEX_CONFIG="$HOME/.codex/config.toml"
NOTEBOOK_BIN="$HOME/.local/bin/notebooklm-mcp"
TESSL_BIN="$HOME/.local/bin/tessl"
NOTEBOOK_SKILL="$HOME/.agents/skills/notebooklm/SKILL.md"
SNAPSHOT_ROOT=${CHECK_SNAPSHOTS_ROOT:-}

check_file() {
  if [ -f "$1" ]; then
    echo "OK  file: $1"
  else
    echo "MISS file: $1"
    return 1
  fi
}

check_contains() {
  if rg -Fq "$2" "$1"; then
    echo "OK  match: $2 in $1"
  else
    echo "MISS match: $2 in $1"
    return 1
  fi
}

check_exec() {
  if [ -x "$1" ]; then
    echo "OK  exec: $1"
  else
    echo "MISS exec: $1"
    return 1
  fi
}

check_cmd() {
  if command -v "$1" >/dev/null 2>&1; then
    echo "OK  cmd: $1"
  else
    echo "MISS cmd: $1"
    return 1
  fi
}

check_file "$DESKTOP_CFG"
check_file "$CLAUDE_SETTINGS"
check_file "$CLAUDE_SETTINGS_LOCAL"
check_file "$CODEX_CONFIG"
check_file "$NOTEBOOK_BIN"
check_file "$TESSL_BIN"
check_file "$NOTEBOOK_SKILL"

check_exec "$NOTEBOOK_BIN"
check_exec "$TESSL_BIN"

check_cmd gh
check_cmd python3
check_cmd npx
check_cmd rg

check_contains "$DESKTOP_CFG" '"playwright"'
check_contains "$DESKTOP_CFG" '"notebooklm"'
check_contains "$DESKTOP_CFG" '"tessl"'
check_contains "$CLAUDE_SETTINGS" '"github@claude-plugins-official": true'
check_contains "$CLAUDE_SETTINGS" '"playwright@claude-plugins-official": true'
check_contains "$CLAUDE_SETTINGS_LOCAL" '"tessl"'
check_contains "$CODEX_CONFIG" '[mcp_servers.playwright]'
check_contains "$CODEX_CONFIG" '[plugins."github@openai-curated"]'
check_contains "$CODEX_CONFIG" '[plugins."gmail@openai-curated"]'
check_contains "$CODEX_CONFIG" '[plugins."google-drive@openai-curated"]'
check_contains "$CODEX_CONFIG" '[plugins."google-calendar@openai-curated"]'

if [ -n "$SNAPSHOT_ROOT" ]; then
  check_file "$SNAPSHOT_ROOT/local/profiles/desktop/claude_desktop_config.json"
  check_file "$SNAPSHOT_ROOT/local/profiles/claude/settings.json"
  check_file "$SNAPSHOT_ROOT/local/profiles/claude/settings.local.json"
  check_file "$SNAPSHOT_ROOT/local/profiles/codex/config.toml"
fi

echo "Capability checks completed."
