#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
TARGET_ROOT=${1:?"usage: sync-shared.sh /absolute/path/to/target-repo"}
ALLOWLIST_JSON="$PROJECT_ROOT/contracts/shared-sync-allowlist.json"

case "$TARGET_ROOT" in
  /*) ;;
  *)
    echo "usage: sync-shared.sh /absolute/path/to/target-repo"
    exit 1
    ;;
esac

mkdir -p "$TARGET_ROOT"

python3 - "$PROJECT_ROOT" "$TARGET_ROOT" "$ALLOWLIST_JSON" <<'PY'
import json
import pathlib
import shutil
import sys

project_root = pathlib.Path(sys.argv[1])
target_root = pathlib.Path(sys.argv[2])
allowlist_path = pathlib.Path(sys.argv[3])
project_root_resolved = project_root.resolve()
target_root_resolved = target_root.resolve()

if target_root_resolved == project_root_resolved or project_root_resolved in target_root_resolved.parents:
    raise RuntimeError("target root must be outside the source repository")

data = json.loads(allowlist_path.read_text())
allowlist = data["allowlist"]
denylist = data["denylist"]
copied = 0

def is_denied(relative_path: pathlib.PurePosixPath) -> bool:
    return any(relative_path.match(pattern) for pattern in denylist)


candidates = set()
for pattern in allowlist:
    for src in project_root.glob(pattern):
        if src.is_file():
            candidates.add(src)
        elif src.is_dir():
            for nested in src.rglob("*"):
                if nested.is_file():
                    candidates.add(nested)

for src in sorted(candidates):
    rel = pathlib.PurePosixPath(src.relative_to(project_root).as_posix())
    if is_denied(rel):
        raise RuntimeError(f"denylist match blocked: {rel}")
    dest = target_root / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dest)
    copied += 1

print(f"copied={copied}")
PY

echo "Allowlisted artifacts copied into $TARGET_ROOT"
