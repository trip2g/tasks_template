#!/bin/sh
set -eu

repo=$(cd "$(dirname "$0")/.." && pwd)
mam=${MAM_WORKSPACE:-"$repo/../mam"}
package=trip2gtasks
dist="$repo/dist"

if [ ! -e "$mam/$package" ]; then
	ln -s "$repo/ui" "$mam/$package"
fi

cd "$mam"
log=$(mktemp)
MAM_PULL_DISABLED=${MAM_PULL_DISABLED:-1} NODE_PATH="$mam/node_modules" node node_modules/.bin/mam "$package/app" > "$log" 2>&1 || true
if grep -q 'Audit fail\|error TS' "$log"; then
	grep 'error TS' "$log" | sort -u >&2
	rm -f "$log"
	exit 1
fi
rm -f "$log"

bundle="$repo/ui/app/-"
mkdir -p "$dist"
{
	cat "$bundle/web.js"
	printf '\n;\n'
	for locale in "$bundle"/web.locale=*.json; do
		lang=$(basename "$locale" .json | sed 's/^web\.locale=//')
		printf '$mol_locale.texts(%s, ' "\"$lang\""
		cat "$locale"
		printf ');\n'
	done
} > "$dist/tasks.js"

cp "$repo/_layouts/tasks.html" "$repo/_layouts/boards.html" "$repo/queries/tasks_board.md" "$repo/queries/boards_index.md" "$dist/"
ls -l "$dist"
