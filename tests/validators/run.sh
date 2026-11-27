#!/bin/sh
set -eu
repo=$(cd "$(dirname "$0")/../.." && pwd)
vault=$(mktemp -d)
cp -R "$repo/tests/validators/vault/." "$vault/"
cp -R "$repo/validators" "$repo/patches" "$vault/"
"$repo/scripts/task-validator-lists" "$vault/validators/task.md" \
	--status Inbox --status Doing --status Blocked --status Done \
	--person Leo --person Maya --blocked-status Blocked
"$TRIP2G_BIN" lint "$vault" 2>&1 | grep 'validate validators/' | sort
rm -rf "$vault"
