#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
TARGET_ROOT=${1:-"$PROJECT_ROOT/adapters/antigravity/output"}

mkdir -p "$TARGET_ROOT/.agent/rules" "$TARGET_ROOT/portable"

python3 - "$PROJECT_ROOT" "$TARGET_ROOT" <<'PY'
import json
import pathlib
import shutil
import sys

project_root = pathlib.Path(sys.argv[1])
target_root = pathlib.Path(sys.argv[2])
portable_root = target_root / "portable"
skills_out = target_root / ".agent" / "skills_index.json"
agents_out = target_root / ".agent" / "agents_index.json"
manifest_out = target_root / "portable_manifest.json"

portable_patterns = [
    "CLAUDE.md",
    "CONSTITUTION.md",
    "_index-agents.md",
    "_index-commands.md",
    "_index-routing.md",
    "_index-skills.md",
    "_index-workflows.md",
    "_versions.md",
    "contracts",
    "references",
    "assets",
    "skills",
    "agents",
]

def copy_entry(src: pathlib.Path) -> None:
    rel = src.relative_to(project_root)
    dest = portable_root / rel
    if src.is_dir():
        shutil.copytree(src, dest, dirs_exist_ok=True)
    else:
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest)

copied = []
for pattern in portable_patterns:
    for src in sorted(project_root.glob(pattern)):
        if src.exists():
            copy_entry(src)
            copied.append(str(src.relative_to(project_root)))

for skill_dir in sorted(project_root.glob("packs/*/skill")):
    copy_entry(skill_dir)
    copied.append(str(skill_dir.relative_to(project_root)))

skills = []
for skill in sorted(project_root.glob("skills/*/SKILL.md")):
    skill_dir = skill.parent
    skills.append(
        {
            "id": skill_dir.name,
            "path": str(skill.relative_to(project_root)),
            "scope": "core",
            "description": f"Repo-local skill: {skill_dir.name}",
        }
    )

for skill in sorted(project_root.glob("packs/*/skill/SKILL.md")):
    pack = skill.parent.parent.name
    skills.append(
        {
            "id": pack,
            "path": str(skill.relative_to(project_root)),
            "scope": "pack",
            "description": f"Portable pack skill exported from {pack}",
        }
    )

agents = []
for agent in sorted(project_root.glob("agents/*.md")):
    agents.append(
        {
            "id": agent.stem,
            "path": str(agent.relative_to(project_root)),
            "description": f"Repo-local agent definition: {agent.stem}",
        }
    )

skills_out.write_text(json.dumps(skills, indent=2) + "\n")
agents_out.write_text(json.dumps(agents, indent=2) + "\n")
manifest_out.write_text(
    json.dumps(
        {
            "portable": copied,
            "desktopOnly": [
                "profiles/desktop/claude_desktop_config.template.json",
                "profiles/claude/settings.local.template.json",
                "live local overlays under local/profiles/",
            ],
        },
        indent=2,
    )
    + "\n"
)
PY

cat > "$TARGET_ROOT/.agent/rules/GEMINI.md" <<'EOF'
# JM Labs Antigravity Rules

Claude Desktop remains canonical.

Portable capabilities:
- core rules and contracts
- compact architecture assets
- repo-local skills and agents as source artifacts
- exported skills and agents metadata

Desktop-only capabilities:
- Claude Desktop MCP bindings
- trusted folder posture
- scheduled task preferences
- local auth-backed NotebookLM flows
- Tessl runtime bindings
EOF

cat > "$TARGET_ROOT/compatibility-report.md" <<'EOF'
# Antigravity Compatibility Report

## Portable

- Governance files and contracts
- References and compact architecture assets
- Repo-local skills and agents as portable source artifacts
- Domain pack skills that do not require Claude Desktop runtime

## Desktop-Only

- playwright MCP binding in Claude Desktop
- notebooklm MCP binding in Claude Desktop
- tessl MCP binding in Claude Desktop
- localAgentModeTrustedFolders and related desktop preferences
- local auth and browser-backed operator state

## Notes

- See `portable_manifest.json` for the exported surface.
- See `.agent/skills_index.json` and `.agent/agents_index.json` for portable metadata.
EOF

echo "Antigravity export created at $TARGET_ROOT"
echo "Portable artifacts available at $TARGET_ROOT/portable"
