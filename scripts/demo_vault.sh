#!/bin/sh
set -eu

repo=$(cd "$(dirname "$0")/.." && pwd)
out=$1
bundle=${2:-}

mkdir -p "$out/_layouts" "$out/queries"
cp -R "$repo/example/." "$out/"
cp "$repo/queries/"*.md "$out/queries/"
cp "$repo/_layouts/tasks.html" "$repo/_layouts/boards.html" "$out/_layouts/"

if [ -n "$bundle" ]; then
	sed -i "s#https://github.com/trip2g/tasks_template/releases/latest/download/tasks.js#$bundle#" "$out/_layouts/tasks.html" "$out/_layouts/boards.html"
fi
