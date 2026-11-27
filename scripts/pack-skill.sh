#!/bin/sh
set -eu

repo=$(cd "$(dirname "$0")/.." && pwd)
out=${1:-"$repo/dist/skill"}
skill="$out/tasks-board"

rm -rf "$skill"
mkdir -p "$skill/scripts" "$skill/layouts" "$skill/projects/queries" "$skill/projects/validators" "$skill/projects/patches"
cp "$repo/skills/tasks-board/SKILL.md" "$skill/"
cp -R "$repo/skills/tasks-board/references" "$skill/"
cp "$repo/skills/tasks-board/scripts/tasks.py" "$repo/scripts/migrate-kanban-board" "$repo/scripts/task-validator-lists" "$skill/scripts/"
cp "$repo/_layouts/tasks.html" "$repo/_layouts/boards.html" "$skill/layouts/"
cp "$repo/queries/tasks_board.md" "$repo/queries/boards_index.md" "$skill/projects/queries/"
cp "$repo/validators/task.md" "$repo/validators/board.md" "$skill/projects/validators/"
cp "$repo/patches/tasks_validate.md" "$skill/projects/patches/"
find "$skill" -type f | sort
