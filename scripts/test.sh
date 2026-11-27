#!/bin/sh
set -eu

repo=$(cd "$(dirname "$0")/.." && pwd)
mam=${MAM_WORKSPACE:-"$repo/../mam"}
failed=0

for query in "$repo"/tests/queries/*.query; do
	name=$(basename "$query" .query)
	actual=$(mktemp)
	notes="$repo/tests/queries/$name.notes.json"
	[ -e "$notes" ] || notes="$repo/tests/queries/example_notes.json"
	NOW=$(cat "$repo/tests/queries/$name.now.json" 2>/dev/null || true) "$repo/scripts/run_query.sh" "$repo/$(cat "$query")" "$notes" "$(cat "$repo/tests/queries/$name.params.json")" > "$actual"
	if diff -u "$repo/tests/queries/$name.expected.json" "$actual"; then
		echo "ok   query $name"
	else
		echo "FAIL query $name"
		failed=1
	fi
	rm -f "$actual"
done

if "$repo/scripts/run_query.sh" "$repo/queries/tasks_board.md" "$repo/tests/queries/example_notes.json" '{}' 2>&1 | grep -q 'Undefined external variable: now'; then
	echo "ok   query without now or today fails the way the page expects"
else
	echo "FAIL query without now or today"
	failed=1
fi

if [ -n "${T2G_URL:-}" ]; then
	python3 "$repo/tests/live_meta.py" || failed=1
fi

python3 -m unittest discover -s "$repo/skills/tasks-board/tests" || failed=1

"$repo/scripts/build.sh" > /dev/null
NODE_PATH="$mam/node_modules" node "$repo/ui/app/-/node.test.js" || failed=1

exit $failed
