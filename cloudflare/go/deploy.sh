#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
WORKER_BIN="/Users/stewartos/.openclaw/agents/botler/workspace/projects/youcast/app/node_modules/wrangler/bin/wrangler.js"
BUILD_DIR=$(mktemp -d /tmp/tideline-worker.XXXXXX)
trap 'rm -rf "$BUILD_DIR"' EXIT

mkdir -p "$BUILD_DIR/go/site"
cp -R "$ROOT/cloudflare/go/src" "$ROOT/cloudflare/go/migrations" "$BUILD_DIR/go/"
cp "$ROOT/cloudflare/go/wrangler.jsonc" "$BUILD_DIR/go/wrangler.jsonc"
rsync -a --exclude '*.md' --exclude '.DS_Store' "$ROOT/signallabs/" "$BUILD_DIR/go/site/"

node "$WORKER_BIN" deploy --profile tideline --cwd "$BUILD_DIR/go" --message "Deploy TideLine boat site and contact intake" "$@"
