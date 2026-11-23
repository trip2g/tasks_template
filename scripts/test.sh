#!/bin/sh
set -eu

repo=$(cd "$(dirname "$0")/.." && pwd)
mam=${MAM_WORKSPACE:-"$repo/../mam"}
failed=0

for query in "$repo"/tests/queries/*.query; do
	name=$(basename "$query" .query)
	actual=$(mktemp)
	"$repo/scripts/run_query.sh" "$repo/$(cat "$query")" "$repo/tests/queries/example_notes.json" "$(cat "$repo/tests/queries/$name.params.json")" > "$actual"
	if diff -u "$repo/tests/queries/$name.expected.json" "$actual"; then
		echo "ok   query $name"
	else
		echo "FAIL query $name"
		failed=1
	fi
	rm -f "$actual"
done

python3 -m unittest discover -s "$repo/skills/tasks-board/tests" || failed=1

"$repo/scripts/build.sh" > /dev/null
NODE_PATH="$mam/node_modules" node "$repo/ui/app/-/node.test.js" || failed=1

exit $failed
