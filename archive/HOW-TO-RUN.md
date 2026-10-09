# How to Run MCP Playbook

Two audiences: the **library user** (installs the npm package) and the **library developer** (works on this repo).

---

## For library users

```bash
npm install --save-dev mcp-playbook   # 1. install in their project
npx mcp-playbook init                 # 2. creates playbook.config.ts
# 3. edit playbook.config.ts → point `servers` at their MCP server
npx mcp-playbook dev                  # 4. opens http://localhost:4242
```

They never touch the source, Vite or tsup. npm ships the prebuilt `dist/` (CLI, server and React UI).

---

## For library developers

### First-time setup

```bash
git clone https://github.com/rahulnag/mcp-playbook.git
cd mcp-playbook
npm install
npm run build        # tsup (CLI/server) + Vite (UI) → dist/
ls dist/             # index.js  index.mjs  index.d.ts  cli/  server/  client/
```

### Run against the bundled example

```bash
npx mcp-playbook dev --config example/playbook.config.ts
# → http://localhost:4242, showing 3 tools from example/mock-server.mjs
```

Inside this repo, `npx mcp-playbook` runs **your local `dist/`**, not the npm version.

### Run against your own MCP server

```bash
npx mcp-playbook dev --config /path/to/your-project/playbook.config.ts

# or link your local build into another project
npm link                       # in this repo
cd /your-project && npm link mcp-playbook
npx mcp-playbook dev
```

---

## Development workflow

**Changing CLI/server code** (`src/cli`, `src/server`, `src/config.ts`):

```bash
npm run dev                                                # terminal 1: tsup rebuilds on save
npx mcp-playbook dev --config example/playbook.config.ts   # terminal 2: restart after each rebuild
```

**Changing the UI** (`src/client`):

```bash
npx mcp-playbook dev --config example/playbook.config.ts --no-open   # terminal 1: API on :4242
npm run dev:client                                                   # terminal 2: Vite on :5173
```

Open **http://localhost:5173**. The UI hot-reloads on save, and API calls are forwarded to 4242.

**Before committing:**

```bash
npm run typecheck && npm run build && npm test
```

---

## Command reference

```
Command                              Who                When
────────────────────────────────────────────────────────────────────────
npm install                          developer          once after clone
npm run build                        developer          before running locally
npm run dev                          developer          while editing CLI/server
npm run dev:client                   developer          while editing the UI (open :5173)
npm run typecheck / npm test         developer          before every commit / PR
npm link                             developer          to test in another project
npm publish                          maintainer         release (see NPM-PUBLISH-GUIDE.md)

npm install --save-dev mcp-playbook  user               once per project
npx mcp-playbook init                user               once, creates the config
npx mcp-playbook dev                 user               daily, live docs + playground
npx mcp-playbook build               user               static site for deployment
npx mcp-playbook dev --port 8080     user               custom port (busy ports auto-skip)
```

---

## What happens when someone runs `npx mcp-playbook dev`

```
bin/mcp-playbook.js
  → dist/cli/index.js                  parse the command        (src/cli/index.ts)
  → load playbook.config.ts via jiti                            (src/server/load-config.ts)
  → connect to each server, call tools/list                     (src/server/connector.ts)
  → start Express on 4242 (or the next free port)               (src/server/dev-server.ts)
       serves dist/client (the React UI)
       GET  /api/servers   → tool list
       POST /api/execute   → runs a tool
       WebSocket           → reloads the browser when the config is saved
  → browser renders the UI                                      (src/client/)
  → "Run tool" → POST /api/execute → connector runs the real tool → result shown
```

Each step maps to one file, so you know where to look when something breaks.
