#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
TARGET_ROOT=${1:-"$PROJECT_ROOT/adapters/antigravity/output"}

mkdir -p "$TARGET_ROOT/.agent/rules"

python3 - "$PROJECT_ROOT" "$TARGET_ROOT/.agent/skills_index.json" <<'PY'
import json
import pathlib
import sys

project_root = pathlib.Path(sys.argv[1])
out_path = pathlib.Path(sys.argv[2])
items = []

for skill in sorted(project_root.glob("packs/*/skill/SKILL.md")):
    pack = skill.parent.parent.name
    items.append(
        {
            "id": pack,
            "path": str(skill.relative_to(project_root)),
            "name": pack.replace("-", " "),
            "description": f"Portable skill exported from {pack}"
        }
    )

out_path.write_text(json.dumps(items, indent=2) + "\n")
PY

cat > "$TARGET_ROOT/.agent/rules/GEMINI.md" <<EOF
# JM Labs Antigravity Rules

Claude Desktop remains canonical.

Portable capabilities:
- prompts and templates
- exported skills metadata
- references and runtime documents

Desktop-only capabilities:
- Claude Desktop MCP bindings
- trusted folder posture
- scheduled task preferences
- local auth-backed NotebookLM flows
- Tessl runtime bindings
EOF

cat > "$TARGET_ROOT/compatibility-report.md" <<EOF
# Antigravity Compatibility Report

## Portable

- Runtime indexes and templates
- References and contracts
- Domain pack assets that do not require Claude Desktop runtime

## Desktop-Only

- playwright MCP binding in Claude Desktop
- notebooklm MCP binding in Claude Desktop
- tessl MCP binding in Claude Desktop
- localAgentModeTrustedFolders and related desktop preferences
- local auth and browser-backed operator state
EOF

echo "Antigravity export created at $TARGET_ROOT"

