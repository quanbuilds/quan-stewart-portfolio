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

if [ "${1:-}" = "--dry-run" ]; then
  node "$WORKER_BIN" versions upload --profile tideline --cwd "$BUILD_DIR/go" --dry-run
  exit 0
fi

UPLOAD_LOG="$BUILD_DIR/upload.log"
node "$WORKER_BIN" versions upload --profile tideline --cwd "$BUILD_DIR/go" --message "Deploy TideLine Loki owner app free test" > "$UPLOAD_LOG" 2>&1
cat "$UPLOAD_LOG"
VERSION_ID=$(sed -n 's/.*Version ID:[[:space:]]*\([0-9a-f-]*\).*/\1/p' "$UPLOAD_LOG" | tail -n 1)
if [ -z "$VERSION_ID" ]; then
  echo "Unable to read uploaded Worker version ID" >&2
  exit 1
fi
node "$WORKER_BIN" versions deploy "$VERSION_ID@100%" --profile tideline --cwd "$BUILD_DIR/go" --yes --message "Deploy TideLine Loki owner app free test"
