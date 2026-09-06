<div align="left">

<div align="center"> <img src="https://i.ibb.co/RpSD7Csv/logo.png" alt="MCP Playbook" width="80%" height="80%"/>

# MCP Playbook

**Playbook for MCP tools** — auto-generates interactive documentation and a live playground for your MCP servers.

[![npm version](https://img.shields.io/npm/v/mcp-playbook?color=7c74d8&labelColor=1a1a1a)](https://www.npmjs.com/package/mcp-playbook)
[![license](https://img.shields.io/npm/l/mcp-playbook?color=5dcaa5&labelColor=1a1a1a)](LICENSE)
[![node](https://img.shields.io/node/v/mcp-playbook?color=5dcaa5&labelColor=1a1a1a)](https://nodejs.org)
[![MCP spec](https://img.shields.io/badge/MCP%20spec-2026--07--28-7c74d8?labelColor=1a1a1a)](https://spec.modelcontextprotocol.io)

[Quick Start](#-quick-start) · [Configuration](#-configuration) · [CLI](#-cli-reference) · [Who is this for](#-who-is-this-for) · [Comparison](#-how-it-compares) · [Server structure](#-mcp-server-file-structure--what-you-need-to-know) · [Roadmap](#-roadmap)

---

<img src="https://i.ibb.co/RpSD7Csv/logo.png" alt="MCP Playbook UI" width="50%" height="50%"/>

</div>

---

## ⚡ What is MCP Playbook?

If you have built MCP tools, you know the problem:

- Teammates **do not know what tools exist**
- There is **no documentation** of parameters or return types
- **Testing a tool** requires writing code or using raw JSON in the Inspector
- **New developers** spend hours figuring out what the server can do
- Tool documentation **goes stale** the moment anyone updates the server

**MCP Playbook** solves all of this — the same way Playbook solved it for React components.

It connects to your MCP server, **auto-discovers every tool** from its JSON Schema, and renders a beautiful interactive documentation site with a live playground. Zero manual documentation. Always up to date.

```bash
npx mcp-playbook init    # create config — 30 seconds
npx mcp-playbook dev     # open http://localhost:4242
```

---

## 🎯 Problem statement

MCP (Model Context Protocol) is becoming the standard for exposing AI tools. Teams are building MCP servers with 10, 50, even 200+ tools. But there is no standard way to:

| Problem | Without MCP Playbook | With MCP Playbook |
|---|---|---|
| Discover available tools | Read source code or raw JSON | Browse a searchable UI |
| Understand a tool's parameters | Read the schema manually | Auto-generated docs with type badges |
| Test a tool | Write code or use raw Inspector | Click Run in the browser |
| Share docs with teammates | Write and maintain markdown manually | Deploy a static site from one command |
| Onboard a new developer | Days of reading code | Open a URL |
| Keep docs up to date | Manual — always goes stale | Automatic — re-reads server on every run |

---

## 👥 Who is this for?

### ✅ Primary audience — MCP server developers

If you are **building an MCP server** in any language, this library documents and tests it automatically.

```
You build: Node.js MCP server with 50 tools
You run:   npx mcp-playbook dev
You get:   Complete interactive docs for all 50 tools instantly
```

**Best fit:**
- Backend developers building MCP servers in Node.js, Python, Go, Rust
- Fullstack teams using Next.js with MCP API routes
- Teams building AI agents that expose MCP tools
- Open source MCP server maintainers who need public documentation

### ✅ Secondary audience — MCP tool consumers

If you are **consuming MCP tools** built by another team, MCP Playbook is your reference guide — the same way Swagger UI documents REST APIs you consume.

```
Your team: building AI agents that call backend MCP tools
You need:  know what tools exist, what parameters they take
You get:   deployed URL your whole team bookmarks
```

### ✅ Tertiary audience — non-developer stakeholders

Product managers, QA engineers, technical writers, and external API partners who need to understand what MCP tools are available — without running any code locally.

```
PM needs:  understand what the AI agent can do
They open: https://mcp-docs.yourcompany.com
They see:  every tool, every parameter, live testing UI
```

---

## ❌ Who is this NOT for?

| Situation | Why MCP Playbook does not fit |
|---|---|
| Pure React frontend with no MCP server | No MCP tools to document |
| REST-only API (no MCP) | Use Swagger / OpenAPI instead |
| Mobile app with no MCP server | No MCP tools involved |
| You need to debug MCP protocol messages | Use `@modelcontextprotocol/inspector` instead |

---

## 🌐 Language support

MCP Playbook connects over the **MCP protocol** — it does not care what language your server is written in. As long as your server speaks valid MCP, it works.

| Server language | Transport | Works? | Notes |
|---|---|---|---|
| **Node.js / TypeScript** | stdio, HTTP, SSE | ✅ | Best support, native |
| **Python** | stdio, HTTP, SSE | ✅ | FastMCP, official Python SDK |
| **Go** | HTTP, SSE | ✅ | Any Go MCP library |
| **Rust** | HTTP, SSE | ✅ | Any Rust MCP library |
| **Any language** | HTTP, SSE | ✅ | If it speaks MCP protocol |

> **Key insight:** MCP Playbook calls `tools/list` — a core MCP protocol method that every compliant server must implement. The server's internal language and framework are completely invisible to the library.

---

## 🔄 How it compares

### MCP Playbook vs MCP Inspector

The most common question. These are **complementary tools**, not competitors.

| Feature | `@modelcontextprotocol/inspector` | `mcp-playbook` |
|---|---|---|
| **Purpose** | Debug and validate protocol | Document and share with team |
| **Audience** | Server author (you) | Whole team + external devs |
| **Hosting** | Localhost only — not shareable | Deploy to any server or URL |
| **Persistent examples** | ❌ Fresh every session | ✅ Defined in config, committed to git |
| **Multi-server view** | ❌ One server at a time | ✅ All servers in one dashboard |
| **Static deployable docs** | ❌ Needs live Node process | ✅ `mcp-playbook build` → static site |
| **Raw JSON-RPC logs** | ✅ Full protocol inspection | ❌ Not the goal |
| **OAuth debugging** | ✅ Built-in | 🗓 Planned |
| **Team sharing via URL** | ❌ Per-launch token, localhost only | ✅ Deploy and share |
| **CLI / TUI mode** | ✅ | ❌ |
| **Config committed to git** | ❌ | ✅ |

**Use the Inspector when:** you are building a server and need to debug protocol messages, test OAuth flows, or inspect raw JSON-RPC communication.

**Use MCP Playbook when:** you want permanent team documentation, a shareable URL, onboarding for new developers, or a deployable static docs site.

### MCP Playbook vs Swagger UI

| Feature | Swagger UI | MCP Playbook |
|---|---|---|
| Protocol | REST / OpenAPI | MCP (Model Context Protocol) |
| Auto-discovery | Reads OpenAPI spec file | Connects to live MCP server |
| Live execution | ✅ | ✅ |
| Static build | ✅ | ✅ |
| Language agnostic | ✅ | ✅ |
| For AI tools | ❌ | ✅ |

---

## 🚀 Quick start

### Requirements

- **Node.js 18.0.0 or higher**
- An existing MCP server (stdio, HTTP, or SSE transport)
- npm, pnpm, or yarn

### Step 1 — Install

```bash
# npm
npm install --save-dev mcp-playbook

# pnpm
pnpm add -D mcp-playbook

# yarn
yarn add -D mcp-playbook

# or run without installing
npx mcp-playbook init
```

### Step 2 — Create config

```bash
npx mcp-playbook init
```

This creates `playbook.config.ts` in your current directory.

### Step 3 — Point it at your server

```typescript
// playbook.config.ts
import { defineConfig } from 'mcp-playbook'

export default defineConfig({
  title: 'My API Playbook',
  servers: [
    {
      name:      'My MCP Server',
      transport: 'stdio',
      command:   'node',
      args:      ['./server.js'],
    }
  ]
})
```

### Step 4 — Start

```bash
npx mcp-playbook dev
```

Browser opens at **http://localhost:4242** showing all your tools with auto-generated documentation and a live playground.

---

## ⚙️ Configuration

All configuration lives in `playbook.config.ts` at your project root. Use `defineConfig()` for TypeScript autocomplete.

### Full reference

```typescript
import { defineConfig } from 'mcp-playbook'

export default defineConfig({

  // ── Required ──────────────────────────────────────────────────────

  servers: [

    // stdio transport — spawn a local process
    {
      name:      'Local API',             // display name in UI
      transport: 'stdio',
      command:   'node',                  // or 'python3', 'go run', etc.
      args:      ['./dist/server.js'],    // path to your server entry file
      env: {                              // environment variables (optional)
        API_KEY:    process.env.API_KEY!,
        DB_URL:     process.env.DB_URL!,
      },
      cwd: './packages/api',              // working directory (optional)
    },

    // HTTP transport — connect to already-running server
    {
      name:      'Remote API',
      transport: 'http',
      url:       'http://localhost:3001/mcp',
      headers: {                          // auth headers (optional)
        'Authorization': `Bearer ${process.env.TOKEN}`,
        'X-API-Key':     process.env.API_KEY!,
      }
    },

    // SSE transport — Server-Sent Events
    {
      name:      'Streaming Server',
      transport: 'sse',
      url:       'http://localhost:3002/sse'
    },

  ],

  // ── Optional ──────────────────────────────────────────────────────

  title:       'Acme Corp API Playbook',
  description: 'Interactive docs for all internal MCP tools',
  port:        4242,                      // default: 4242

  // Hand-written examples per tool — appear in Examples tab
  // Load into Try tab with one click
  // You do NOT need examples for every tool — only the important ones
  examples: {
    get_user: [
      {
        label:          'Fetch admin user',
        description:    'Look up the main admin account',
        input:          { userId: 'usr_admin_001', include_meta: true },
        expectedOutput: { id: 'usr_admin_001', name: 'Alice', role: 'admin' }
      },
      {
        label: 'Fetch developer',
        input: { userId: 'usr_dev_042' }
      }
    ],
    create_order: [
      {
        label: 'Standard order',
        input: { userId: 'usr_123', productId: 'prod_456', quantity: 2 }
      }
    ]
  },

  // Group tools into named sections in the sidebar
  // A tool can appear in multiple sections
  // Tools without a tag appear under their server name
  tags: {
    'User management': ['get_user', 'create_user', 'list_users', 'delete_user'],
    'Orders':          ['create_order', 'get_order', 'cancel_order'],
    'Admin':           ['purge_cache', 'get_metrics', 'list_audit_logs'],
  },

  // UI theme customisation
  theme: {
    primary:    '#7C74D8',    // accent colour for buttons, badges, selected items
    background: '#080808',   // main background colour
    font:       'IBM Plex Mono',  // must be available in the browser
  },

})
```

---

## 🔐 Authentication

### For servers that require API keys or tokens

Pass credentials via the `env` field. Your MCP server reads them from environment variables.

```typescript
// playbook.config.ts
servers: [
  {
    name:      'Atlassian API',
    transport: 'stdio',
    command:   'node',
    args:      ['./server.js'],
    env: {
      ATLASSIAN_TOKEN: process.env.ATLASSIAN_TOKEN!,
      ATLASSIAN_URL:   process.env.ATLASSIAN_URL!,
    }
  }
]
```

Set your token in the shell before running:

```bash
export ATLASSIAN_TOKEN=your_personal_api_token
npx mcp-playbook dev
```

### For HTTP servers with auth headers

```typescript
{
  transport: 'http',
  url:       'https://api.yourcompany.com/mcp',
  headers: {
    'Authorization': `Bearer ${process.env.API_TOKEN}`,
  }
}
```

### ⚠️ Current auth limitations

Full OAuth 2.0 in the UI (where each team member logs in with their own account) is **on the roadmap** but not yet implemented. For now:

| Auth method | Supported today |
|---|---|
| API keys via env variables | ✅ |
| Bearer tokens via headers | ✅ |
| Personal access tokens | ✅ |
| OAuth 2.0 in the UI | 🗓 Planned |
| Per-user auth in shared deployments | 🗓 Planned |

For internal team deployments today: use a shared service account token passed via env. For public-facing deployments that need per-user auth: wait for the OAuth feature or run the playground behind your own auth layer (SSO, Cloudflare Access, etc.).

---

## 💻 CLI Reference

All commands are available via `npx mcp-playbook` or the `mcp-playbook` binary if installed globally.

### `mcp-playbook dev`

Starts the development server with hot reload. Opens browser automatically.

```bash
mcp-playbook dev [options]

Options:
  -p, --port <port>      Port to run on (default: 4242)
  -c, --config <path>    Path to config file (default: playbook.config.ts)
  --no-open              Do not open browser automatically
```

```bash
# Examples
mcp-playbook dev
mcp-playbook dev --port 8080
mcp-playbook dev --config ./docs/playbook.config.ts
mcp-playbook dev --no-open
```

### `mcp-playbook build`

Connects to all configured servers, discovers all tools, and generates a **static documentation site**. Deploy it anywhere — no server required at view time.

```bash
mcp-playbook build [options]

Options:
  -o, --output <dir>     Output directory (default: playbook-dist)
  -c, --config <path>    Path to config file (default: playbook.config.ts)
```

```bash
# Examples
mcp-playbook build
mcp-playbook build --output ./docs-site
```

Deploy `playbook-dist/` to **GitHub Pages, Vercel, Netlify**, or any static host.

### `mcp-playbook init`

Scaffolds a `playbook.config.ts` file in the current directory. Safe to run — will not overwrite an existing config.

```bash
mcp-playbook init
```

---

## 🖥️ The Playbook UI

### Sidebar

Lists all discovered tools grouped by server. Contains:
- **Search** — filters across tool names, descriptions, and tags
- **Server filter** — show tools from one server at a time
- **Connection status** — green dot = connected, red = disconnected
- **Tag groups** — if you defined tags in config

### Docs tab

Auto-generated from the tool's JSON Schema. Shows:
- Every parameter with name, **type badge** (string, number, boolean, enum, object)
- Required vs optional label
- Default values
- Descriptions
- Enum values listed as pills
- Which server the tool belongs to

### Try it tab

Interactive form built from the input schema:
- `string` → text input
- `number` → number input
- `boolean` → true/false toggle
- `enum` → dropdown select
- `object` → nested form

Click **Run tool** to execute against the real MCP server. Response shown with syntax highlighting and execution time in milliseconds.

### Examples tab

Shows all examples you defined in `playbook.config.ts`. Click **Load →** to pre-fill the Try tab with those values. If no examples are defined, shows instructions for adding them.

### Schema tab

Shows the raw JSON Schema and the complete MCP tool definition — ready to copy-paste into another project.

### Hot reload

When running `mcp-playbook dev`, the config file is watched. Add a new server or modify examples → browser refreshes automatically without a page reload.

---

## 🏗️ How MCP Playbook works

```
Your playbook.config.ts
          ↓
mcp-playbook reads config
          ↓
Connects to each MCP server
(spawns process for stdio / connects to URL for HTTP/SSE)
          ↓
Calls tools/list on each server
(standard MCP protocol — works with any compliant server)
          ↓
Gets all tool schemas (name, description, inputSchema)
          ↓
Merges with your hand-written examples from config
          ↓
Serves React UI at localhost:4242
          ↓
Docs tab:     renders schema as human-readable documentation
Try it tab:   renders interactive form, executes real tool calls
Examples tab: shows preset inputs, loads them into Try tab
Schema tab:   shows raw JSON for copy-paste
```

### The standard it relies on

Every MCP server regardless of language or library must implement `tools/list` — it is a core method of the MCP specification (maintained by Anthropic, open standard). This is why MCP Playbook works with any compliant server:

```
Atlassian MCP server → implements tools/list ✓
Linear MCP server    → implements tools/list ✓
Your custom server   → implements tools/list ✓
Any future server    → implements tools/list ✓
```

---

## 📂 MCP server file structure — what you need to know

### One entry point, unlimited internal files

An MCP server always has **one entry point file** — the file MCP clients connect to. But internally it can import from as many files as you want.

```
From outside (mcp-playbook, Claude, any MCP client):
  sees → one process running server.js
  does not know → how many internal files exist

From inside (your code):
  server.js imports tools/index.ts
  tools/index.ts imports users/get_user.ts
  tools/index.ts imports issues/create_issue.ts
  ... 100 files imported — all invisible to the outside
```

In your `playbook.config.ts` you always point at the **entry file only**:

```typescript
servers: [
  {
    name:      'My API',
    transport: 'stdio',
    command:   'node',
    args:      ['./server.js'],    // ← always the entry point
    // internal file structure does not matter here
  }
]
```

### Multiple MCP servers — each its own entry file

You can run multiple completely separate MCP servers — each its own process, its own entry file, its own set of tools. MCP Playbook connects to all of them and shows everything in one unified dashboard.

```
Real world example — Atlassian:

  jira-mcp/server.js          → Jira tools only
  confluence-mcp/server.js    → Confluence tools only
  bitbucket-mcp/server.js     → Bitbucket tools only
```

```typescript
// playbook.config.ts — connect to all three at once
export default defineConfig({
  servers: [
    {
      name:      'Jira',
      transport: 'stdio',
      command:   'node',
      args:      ['./jira-mcp/server.js'],
    },
    {
      name:      'Confluence',
      transport: 'stdio',
      command:   'node',
      args:      ['./confluence-mcp/server.js'],
    },
    {
      name:      'Bitbucket',
      transport: 'stdio',
      command:   'node',
      args:      ['./bitbucket-mcp/server.js'],
    },
  ]
})
```

MCP Playbook spawns all three as separate processes and shows all their tools in one searchable UI — grouped by server, filterable, searchable.

> **Key rule:** one entry point per MCP server. How many files live inside that server is entirely your choice and completely invisible to MCP Playbook.

---

## 📂 Structuring a large MCP server (100+ tools)

For servers with many tools, use the **one file per tool + auto-loader** pattern. You never register tools manually in `playbook.config.ts` — MCP Playbook discovers them all automatically from the server.

```
src/
  tools/
    users/
      get_user.ts
      create_user.ts
      list_users.ts
    issues/
      create_issue.ts
      search_issues.ts
    index.ts        ← auto-loads all tool files
  server.ts         ← stays tiny forever
```

```typescript
// src/tools/users/get_user.ts — one file, one tool
import { z } from 'zod/v4'

export const name = 'get_user'

export const config = {
  title:       'Get User',
  description: 'Retrieve a user by their unique ID',
  inputSchema: z.object({
    userId:       z.string().describe('The user UUID'),
    include_meta: z.boolean().default(false).describe('Include metadata'),
  })
}

export const handler = async ({ userId, include_meta }) => {
  const user = await db.users.findById(userId)
  return { content: [{ type: 'text', text: JSON.stringify(user) }] }
}
```

```typescript
// src/tools/index.ts — auto-loads every tool file
import { readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export async function registerAllTools(server) {
  function getToolFiles(dir) {
    const files = []
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) {
        files.push(...getToolFiles(full))
      } else if (entry.endsWith('.ts') && entry !== 'index.ts') {
        files.push(full)
      }
    }
    return files
  }

  for (const file of getToolFiles(__dirname)) {
    const mod = await import(pathToFileURL(file).href)
    server.registerTool(mod.name, mod.config, mod.handler)
  }
}
```

```typescript
// src/server.ts — stays this small forever
import { McpServer }  from '@modelcontextprotocol/server'
import { serveStdio } from '@modelcontextprotocol/server/stdio'
import { registerAllTools } from './tools/index.ts'

serveStdio(() => {
  const server = new McpServer({ name: 'my-api', version: '1.0.0' })
  registerAllTools(server)
  return server
})
```

Adding a new tool = create one new file. `playbook.config.ts` never changes.

---

## 🚢 Deploying MCP Playbook

### Deploy to GitHub Pages

```yaml
# .github/workflows/deploy-playbook.yml
name: Deploy MCP Playbook

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18

      - run: npm install
      - run: npm run build          # build your MCP server first
      - run: npx mcp-playbook build --output ./docs

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
```

Every push to `main` auto-rebuilds and redeploys your docs.

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Build static docs
npx mcp-playbook build

# Deploy
vercel playbook-dist/
```

### Deploy on your own server (always-on)

```bash
# Build static docs
npx mcp-playbook build --output /var/www/mcp-docs

# Serve with nginx — no Node.js needed at view time
# Just static files
```

---

## 🔧 Local development (for library contributors)

If you are contributing to MCP Playbook itself:

```bash
# Clone the repo
git clone https://github.com/your-org/mcp-playbook
cd mcp-playbook

# Install dependencies
npm install

# Build everything (server/CLI via tsup + React UI via Vite)
npm run build

# Test against the included example server
npx mcp-playbook dev --config example/playbook.config.ts

# Watch mode — rebuilds on every save
npm run dev          # Terminal 1: rebuilds server/CLI
npm run dev:client   # Terminal 2: rebuilds React UI

# Test as a real user would install it
npm pack
# creates mcp-playbook-0.1.0.tgz

mkdir /tmp/test-project && cd /tmp/test-project
npm init -y
npm install /path/to/mcp-playbook-0.1.0.tgz
npx mcp-playbook init
npx mcp-playbook dev
```

### Using npm link for active development

```bash
# Register library globally as a symlink
cd mcp-playbook
npm run build
npm link

# Use in any project
cd your-project
npm link mcp-playbook
npx mcp-playbook dev

# After making changes
cd mcp-playbook
npm run build     # changes available immediately — no relinking needed
```

---

## 🔍 Troubleshooting

### Config not found

```bash
Error: Config not found: playbook.config.ts

Fix:
npx mcp-playbook init
```

### Port already in use

```bash
Error: Port 4242 is already in use

Fix:
npx mcp-playbook dev --port 4243
```

### Server shows as disconnected

Check the following in order:

1. **stdio transport** — verify `command` and `args` are correct and the file exists
   ```bash
   node ./your-server.js   # run it manually — should start without errors
   ```

2. **HTTP/SSE transport** — verify the server is running at the configured URL
   ```bash
   curl http://localhost:3001/mcp   # should respond
   ```

3. **Environment variables** — if your server needs `API_KEY` etc., pass them via `env` in config

4. **Check the terminal** — the mcp-playbook dev terminal shows connection error details

### dist/ not found (library developers only)

```bash
Error: Cannot find module './dist/cli/index.js'

Fix: npm run build
```

### Tool execution returns 401 Unauthorized

Your MCP server needs authentication credentials. Pass them via env:

```typescript
env: {
  API_TOKEN: process.env.API_TOKEN!,
}
```

Set in your shell:

```bash
export API_TOKEN=your_token_here
npx mcp-playbook dev
```

### Changes to playbook.config.ts not picked up

The config is watched automatically. If it is not updating, click the **↻ Refresh** button in the top bar or restart the dev server.

---

## 🗺️ Roadmap

| Feature | Status |
|---|---|
| Core: auto-discovery, docs, Try it, Examples, Schema tabs | ✅ Done |
| stdio / HTTP / SSE transport | ✅ Done |
| Hot reload on config change | ✅ Done |
| Static site build (`mcp-playbook build`) | ✅ Done |
| Multi-server dashboard | ✅ Done |
| Tool call history / session log | 🗓 Planned |
| Export as curl / fetch / MCP SDK snippet | 🗓 Planned |
| Schema diff and changelog when tool definitions change | 🗓 Planned |
| **Authentication — OAuth 2.0 in the UI** | 🗓 Planned |
| Per-user auth for shared deployments | 🗓 Planned |
| Embeddable React component `<MCPPlaybook />` | 🗓 Planned |
| VS Code extension integration | 🔭 Exploring |
| Hosted team sharing via URL (cloud version) | 🔭 Exploring |
| Mock mode — run without a real server | 🔭 Exploring |
| Semantic search across tool descriptions | 🔭 Exploring |

---

## 🤝 Contributing

PRs and issues are welcome. The MCP ecosystem needs this tool.

```bash
# Clone, build, test
git clone https://github.com/your-org/mcp-playbook
npm install
npm run build
npx mcp-playbook dev --config example/playbook.config.ts
```

Please open an issue before submitting large PRs so we can discuss the approach.

---

## 📄 License

MIT © your-org

---

<div align="center">

**mcp-playbook** · [npm](https://www.npmjs.com/package/mcp-playbook) · [GitHub](https://github.com/your-org/mcp-playbook) · [Issues](https://github.com/your-org/mcp-playbook/issues)

*If this library saves you time, give it a ⭐ on GitHub*

</div>
