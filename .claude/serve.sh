#!/usr/bin/env sh
# .claude/serve.sh — start MCP helper servers declared in mcp.json (POSIX / Linux / macOS / WSL)
#
# Usage:
#   bash .claude/serve.sh          # start all MCP servers in the background
#   bash .claude/serve.sh --stop   # kill all MCP server background processes
#
# Requirements: Node.js >= 18 and npx must be on your PATH.
# Copy .claude/.env.example to .claude/.env and fill in SUPABASE_DB_URL before
# running if you need the postgres MCP server to work.

set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PIDS_FILE="$REPO_ROOT/.claude/.mcp-pids"

# ── Helpers ────────────────────────────────────────────────────────────────────
check_node() {
  if ! command -v node > /dev/null 2>&1; then
    echo "ERROR: Node.js is not installed or not on PATH."
    echo "Install it from https://nodejs.org/ and try again."
    exit 1
  fi
  if ! command -v npx > /dev/null 2>&1; then
    echo "ERROR: npx is not available. Try reinstalling Node.js."
    exit 1
  fi
  echo "Node $(node -v) / npx $(npx -v) found."
}

load_env() {
  ENV_FILE="$REPO_ROOT/.claude/.env"
  if [ -f "$ENV_FILE" ]; then
    # shellcheck disable=SC1090
    . "$ENV_FILE"
    echo "Loaded environment from $ENV_FILE"
  else
    echo "Note: $ENV_FILE not found. Copy .claude/.env.example to .claude/.env and fill in SUPABASE_DB_URL if needed."
  fi
}

start_server() {
  NAME="$1"
  shift
  echo "Starting MCP server: $NAME ..."
  npx "$@" &
  PID=$!
  echo "$NAME=$PID" >> "$PIDS_FILE"
  echo "  $NAME started (PID $PID)"
}

stop_servers() {
  if [ ! -f "$PIDS_FILE" ]; then
    echo "No PID file found at $PIDS_FILE — nothing to stop."
    return
  fi
  echo "Stopping MCP servers..."
  while IFS='=' read -r NAME PID; do
    if kill -0 "$PID" 2>/dev/null; then
      kill "$PID" && echo "  Stopped $NAME (PID $PID)"
    else
      echo "  $NAME (PID $PID) was not running"
    fi
  done < "$PIDS_FILE"
  rm -f "$PIDS_FILE"
  echo "Done."
}

# ── Main ───────────────────────────────────────────────────────────────────────
if [ "${1:-}" = "--stop" ]; then
  stop_servers
  exit 0
fi

check_node
load_env

# Remove stale PID file
rm -f "$PIDS_FILE"

cd "$REPO_ROOT"

start_server "filesystem"  mcp-server-filesystem --enabled-directories .
start_server "git"         mcp-server-git
start_server "node-tools"  mcp-server-node-tools
start_server "web-scraper" mcp-server-web-scraper

# Start postgres server only if SUPABASE_DB_URL is set
if [ -n "${SUPABASE_DB_URL:-}" ]; then
  DATABASE_URL="$SUPABASE_DB_URL" start_server "postgres" mcp-server-postgres
else
  echo "  postgres MCP server skipped (SUPABASE_DB_URL not set)"
fi

echo ""
echo "All MCP servers started. PIDs saved to $PIDS_FILE"
echo "To stop all servers run:  bash .claude/serve.sh --stop"
echo ""
echo "Connect to the MCP servers from Claude Code:"
echo "  - Each server runs as an stdio-based MCP process (no shared HTTP port)."
echo "  - In Claude Code desktop: Settings → MCP Servers → Add and point to the"
echo "    npx command for each server listed in .claude/mcp.json."
echo "  - Alternatively, configure your MCP client to launch these servers"
echo "    directly via the commands in .claude/mcp.json."
