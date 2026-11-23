#!/bin/sh
set -eu

query_note=$1
notes_json=$2
params_json=$3

jsonnet=${JSONNET:-"go run github.com/google/go-jsonnet/cmd/jsonnet@v0.21.0"}
prelude='local notes = std.parseJson(std.extVar("notes")), params = std.parseJson(std.extVar("params")), currentUser = std.parseJson(std.extVar("currentUser")); '
code=$(awk '/^```jsonnet/{on=1; next} /^```/{on=0} on' "$query_note")

$jsonnet \
	--ext-str-file notes="$notes_json" \
	--ext-str params="$params_json" \
	--ext-str currentUser='{"id":1,"role":"admin","isAdmin":true,"signedIn":true}' \
	-e "$prelude$code"
