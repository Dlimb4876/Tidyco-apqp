# .claude — MCP Configuration & Agent Setup

This folder configures the Claude Code desktop app and VS Code Claude Code extension to use local MCP (Model Context Protocol) helper servers and automated agents when working in this repository.

---

## What is here?

| File / folder | Purpose |
|---|---|
| `mcp.json` | Declares MCP helper servers (filesystem, git, node-tools, postgres, web-scraper) and maps agent names to runnable Node scripts |
| `settings.json` | Lists allowed shell commands (portable, relative paths) |
| `serve.sh` | POSIX shell script to pre-start MCP server processes (Linux / macOS / WSL) |
| `serve.ps1` | PowerShell script to start the local HTTP file server for the SPA (Windows) |
| `launch.json` | VS Code launch configuration that runs `serve.ps1` |
| `.env.example` | Template for the `SUPABASE_DB_URL` environment variable |
| `agents/` | Runnable Node.js agent scripts |
| `agents/logs/` | Agent output logs written here (not committed except `.gitkeep`) |
| `rules/` | Rule files — Markdown rules tell Claude Code what to do; JSON rules declare automation triggers |

---

## Quick start

### 1 — Install Node.js (if you haven't)

Download from <https://nodejs.org/> (LTS version recommended).  
Verify with: `node -v` and `npx -v`

### 2 — Set up environment (optional — only needed for Supabase / postgres)

```bash
cp .claude/.env.example .claude/.env
# Edit .claude/.env and fill in your SUPABASE_DB_URL
```

### 3 — Start the local HTTP file server (serves index.html in a browser)

**Windows (PowerShell):**
```powershell
PowerShell -ExecutionPolicy Bypass -File .claude\serve.ps1
```
Then open <http://localhost:8000/index.html> in your browser.

**Linux / macOS / WSL — simple alternative:**
```bash
npx serve . -p 8000
# or: python3 -m http.server 8000
```

### 4 — Connect Claude Code to MCP servers

The MCP servers in `mcp.json` are **stdio-based** — Claude Code launches each one as a child process using the `command` and `args` declared in `mcp.json`. There is no shared HTTP port to connect to.

**Claude Code desktop app:**
1. Open Settings → MCP Servers
2. Click **Add server**
3. Point to your repo's `.claude/mcp.json` (or add each server's `command`/`args` individually)

**VS Code Claude Code extension:**
1. Open the Command Palette (`Ctrl+Shift+P`)
2. Run `Claude: Add MCP Server`
3. Select **Local stdio server** and enter the `command` from `mcp.json` (e.g. `npx mcp-server-filesystem --enabled-directories .`)

**Optional — pre-start MCP servers as background processes (Linux/macOS):**
```bash
bash .claude/serve.sh
# To stop all background MCP processes:
bash .claude/serve.sh --stop
```

---

## Running agent scripts manually

You can test any agent directly from the repo root. Each script reads an optional JSON payload from stdin (fd 0 — works on Linux, macOS, and Windows) and writes a JSON result to stdout.

### code-review agent
Runs lint (`npm run lint:npi`) and tests (`npm test`), prints a JSON summary, and writes a dated log to `agents/logs/`.

```bash
node .claude/agents/code-review.js
# or with context:
echo '{"context":"manual test"}' | node .claude/agents/code-review.js
```

### testing agent
Runs `npm test` and prints a short JSON pass/fail summary.

```bash
node .claude/agents/testing.js
echo '{"context":"commit abc123"}' | node .claude/agents/testing.js
```

### debugging agent
Takes a JSON payload describing a failure and returns heuristic likely-causes and suggested fix commands.

```bash
echo '{"failingTest":"db.test.js","error":"Cannot read properties of undefined"}' \
  | node .claude/agents/debugging.js
```

**Windows (PowerShell):**
```powershell
'{"failingTest":"db.test.js","error":"Cannot read properties of undefined"}' | node .claude/agents/debugging.js
```

---

## Simulating automation triggers

To simulate a PR-open event and confirm the rule fires:

```bash
# 1. Run the agents the rule would call
node .claude/agents/code-review.js > /tmp/cr.json
node .claude/agents/testing.js     > /tmp/test.json

# 2. Merge results (simple concatenation for manual testing)
jq -s '{code_review: .[0], testing: .[1]}' /tmp/cr.json /tmp/test.json \
  > .claude/rules/last-pr-review.json

# 3. Confirm the output file was created
cat .claude/rules/last-pr-review.json
```

To simulate a test-failure trigger:

```bash
echo '{"failingTest":"db.test.js","error":"is not a function"}' \
  | node .claude/agents/debugging.js
```

---

## Where to look for logs

- **Agent logs:** `.claude/agents/logs/code-review-YYYYMMDD.log`  
  Each run appends a JSON block with the full output.
- **MCP server PIDs (if pre-started):** `.claude/.mcp-pids`
- **VS Code / Claude desktop logs:** open the Claude output panel in VS Code (`View → Output → Claude`)

---

## Common errors and fixes

| Error | Likely cause | Fix |
|---|---|---|
| `node: not found` | Node.js not installed | Install from nodejs.org |
| `npx: command not found` | Old Node or broken install | Reinstall Node.js LTS |
| `SUPABASE_DB_URL is not set` | Missing `.env` | Copy `.env.example` → `.env`, fill in your DB URL |
| `jest: not found` | `npm install` not run | Run `npm install` in the repo root |
| MCP server not found in Claude | Server config not loaded | Check that `.claude/mcp.json` is referenced in your Claude Code settings |

---

## Further reading

- `.claude/AGENTS_QUICKSTART.md` — quick reference for using agents in development
- `.claude/agents.md` — full agent development patterns and output format
- `.claude/rules/` — Markdown rule files (code-style, security, testing, navigation, etc.) + JSON automation triggers
- `CLAUDE.md` (repo root) — full project conventions and critical rules
