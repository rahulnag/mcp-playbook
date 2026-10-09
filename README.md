<div align="center">

<img src="https://i.ibb.co/RpSD7Csv/logo.png" alt="MCP Playbook" width="80%"/>

# MCP Playbook

**Interactive docs and a live playground for your MCP servers. Generated automatically.**

[![npm version](https://img.shields.io/npm/v/mcp-playbook?color=7c74d8&labelColor=1a1a1a)](https://www.npmjs.com/package/mcp-playbook)
[![license](https://img.shields.io/npm/l/mcp-playbook?color=5dcaa5&labelColor=1a1a1a)](LICENSE)
[![node](https://img.shields.io/node/v/mcp-playbook?color=5dcaa5&labelColor=1a1a1a)](https://nodejs.org)

[Quick start](#quick-start) · [Configuration](#configuration) · [Recipes](#server-recipes) · [Commands](#commands) · [Deploying](#deploying-the-docs) · [Troubleshooting](#troubleshooting)

</div>

---

## What is it?

You've built an MCP server. Now your teammates need to know **which tools exist, what parameters they take, and how to try them**.

MCP Playbook connects to your server, reads every tool's schema, and gives you a web UI with:

- **Docs** for every tool and parameter (types, required/optional, defaults, descriptions)
- **A "Try it" form** to run any tool against your real server from the browser
- **Saved examples** your team can load with one click
- **A static site build** you can deploy and share as a URL

You don't write any docs by hand, and they stay current: every run reads the latest tools from your server. Think **Storybook or Swagger UI, but for MCP tools**.

```bash
npm install -D mcp-playbook   # 1. install in your project
npx mcp-playbook init         # 2. create playbook.config.ts
npx mcp-playbook dev          # 3. open http://localhost:4242
```

---

## Quick start

**You need:** Node.js 18+ and an MCP server, written in any language.

### 1. Install

```bash
npm install -D mcp-playbook     # or: pnpm add -D mcp-playbook  /  yarn add -D mcp-playbook
```

> Install it **in your project**. Your config file imports from `mcp-playbook`, so it has to be in your project's `node_modules`.

### 2. Create the config file

```bash
npx mcp-playbook init
```

This creates `playbook.config.ts` in the current folder. It never overwrites an existing file.

### 3. Tell it how to start your server

Open `playbook.config.ts` and change `command` and `args` to whatever you normally type to start your server. For example, if you run `node ./server.js`:

```typescript
import { defineConfig } from 'mcp-playbook'

export default defineConfig({
  servers: [
    {
      name:      'My Server',       // any label you like
      transport: 'stdio',           // MCP Playbook starts the server for you
      command:   'node',            // the program...
      args:      ['./server.js'],   // ...and its arguments
    },
  ],
})
```

Not using Node? See [Server recipes](#server-recipes) for Python, TypeScript, Go/Rust, npm packages and HTTP servers.

### 4. Start it

```bash
npx mcp-playbook dev
```

Your browser opens at **http://localhost:4242** with all your tools listed. Edit and save the config while it runs, and the page updates on its own.

---

## Configuration

Everything lives in **`playbook.config.ts`** in your project root. `defineConfig()` gives you autocomplete and type checking in your editor.

Only **`servers`** is required. Every other field is optional.

### Step 1: Pick a transport

The `transport` field tells MCP Playbook **how to reach your server**. Pick the row that matches your setup:

| Your server… | Use `transport:` | Then fill in |
|---|---|---|
| Runs locally as a command (e.g. `node server.js`, `python server.py`). This is the most common case. | `'stdio'` | `command`, `args` (and `env`, `cwd` if needed) |
| Is already running and reachable at a URL like `http://…/mcp` | `'http'` | `url` (and `headers` if it needs auth) |
| Is already running and uses the older SSE transport, at a URL like `http://…/sse` | `'sse'` | `url` (and `headers` if it needs auth) |

**Not sure which one?** Look at your server code:

| In your server code you see… | Transport |
|---|---|
| `StdioServerTransport` (TypeScript), or `mcp.run()` / `mcp.run(transport="stdio")` (Python) | `stdio` |
| `StreamableHTTPServerTransport` (TypeScript), or `mcp.run(transport="streamable-http")` (Python) | `http` |
| `SSEServerTransport` (TypeScript), or `mcp.run(transport="sse")` (Python) | `sse` |

### Step 2: Fill in the server fields

Each entry in `servers` describes one MCP server. Here's every field, what it means, and when you need it.

| Field | Needed for | Required? | What to put |
|---|---|---|---|
| `name` | all | **Yes** | Any label. It's shown in the UI. |
| `transport` | all | **Yes** | `'stdio'`, `'http'` or `'sse'` (see Step 1). |
| `command` | stdio | **Yes** | The program that starts your server: `'node'`, `'python'`, `'uv'`, `'npx'`, `'./my-binary'`… |
| `args` | stdio | No | A list of arguments for `command`, usually the path to your server file. |
| `cwd` | stdio | No | The folder to start the server in. |
| `env` | stdio | No | Environment variables your server needs (API keys, database URLs…). |
| `url` | http, sse | **Yes** | The server's address, e.g. `'http://localhost:3001/mcp'`. |
| `headers` | http, sse | No | HTTP headers sent with every request, usually for auth. |

If a field doesn't apply to your transport, it's ignored (for example, `url` on a `stdio` server).

#### `command` and `args`: how to start your server

Take the command you'd type in a terminal and split it. The **first word** goes in `command` and **everything after it** goes in `args`, one item per word:

```
node ./dist/server.js --verbose
└┬─┘ └──────────┬──────────────┘
command        args: ['./dist/server.js', '--verbose']
```

MCP Playbook runs that command and talks to the server through its input and output. You don't need to start the server yourself. Relative paths in `args` resolve from `cwd`, which by default is the folder you run `mcp-playbook` from.

#### `cwd`: where to run it (optional)

Use `cwd` when your server has to be started **from its own folder**, for example because it reads files with relative paths like `./data.json`, or lives in a monorepo package.

```typescript
cwd:  './packages/api',     // run the server from this folder
args: ['./dist/server.js'], // → resolves to ./packages/api/dist/server.js
```

#### `env`: secrets and settings for your server (optional)

Use `env` when your server reads **environment variables**, for example `process.env.API_KEY` in Node or `os.environ["API_KEY"]` in Python.

```typescript
env: {
  API_KEY: process.env.API_KEY!,   // pass API_KEY from your terminal to the server
  DB_URL:  process.env.DB_URL!,    // pass DB_URL from your terminal to the server
  LOG_LEVEL: 'debug',              // or hard-code a non-secret value
},
```

What this means:

- **The names on the left** (`API_KEY`, `DB_URL`) are only examples. Use **whatever names your server reads**. If your server reads `process.env.GITHUB_TOKEN`, write `GITHUB_TOKEN: process.env.GITHUB_TOKEN!`.
- **`process.env.X`** reads the value from **the terminal where you run `mcp-playbook`**, so your secrets stay out of the config file and out of git.
- **The `!`** is TypeScript for "I know this exists". It only silences an editor warning. If the variable isn't set, your server simply won't receive it.

> ⚠️ **Your server doesn't automatically see your terminal's variables.** For safety, a `stdio` server only gets a small basic set (like `PATH` and `HOME`) plus what you list in `env`. If your server works with `node server.js` but fails inside MCP Playbook, a missing `env` entry is the usual cause.

Set the values in your terminal before starting:

```bash
export API_KEY=sk-123
export DB_URL=postgres://localhost/mydb
npx mcp-playbook dev
```

**Prefer a `.env` file?** Add one line at the top of your config (needs Node 20.12+):

```typescript
import { defineConfig } from 'mcp-playbook'
process.loadEnvFile()   // reads .env from the folder you run mcp-playbook in
```

On older Node versions, install `dotenv` and add `import 'dotenv/config'` instead.

#### `url`: where the running server is (http / sse)

The full address of your server's MCP endpoint, including the path. By convention that's usually **`/mcp`** for `http` and **`/sse`** for `sse`:

```typescript
url: 'http://localhost:3001/mcp'
```

The server must **already be running**. MCP Playbook connects to it but won't start it.

#### `headers`: authentication for http / sse servers (optional)

Headers sent with every request. Use them when your server needs a token or API key:

```typescript
headers: {
  Authorization: `Bearer ${process.env.API_TOKEN}`,
  'X-API-Key':   process.env.MY_API_KEY!,
},
```

The same rule as `env` applies: read secrets from `process.env` instead of typing them into the file.

> **Quick rule:** `env` is for **stdio** servers (passed to the process MCP Playbook starts). `headers` is for **http / sse** servers (sent over the network).

### Step 3: Optional extras

| Field | What it does | Default |
|---|---|---|
| `title` | Name shown in the top bar | `'MCP Playbook'` |
| `description` | Short text shown on the start screen | none |
| `examples` | Ready-made inputs for your tools ([see below](#examples)) | none |
| `tags` | Labels for your tools ([see below](#tags)) | none |
| `port` | Port for `mcp-playbook dev`. The `--port` flag overrides it. If it's busy, the next free port is used. | `4242` |
| `theme` | Reserved for future theming. **Not applied by the UI yet.** | none |

#### Examples

Saved inputs that appear in a tool's **Examples** tab. Click **Load →** to copy them into the Try it form. The key is the **tool name exactly as your server defines it**:

```typescript
examples: {
  get_user: [
    {
      label:          'Fetch admin user',               // required: card title
      input:          { userId: 'usr_admin_001' },      // required: the arguments to fill in
      description:    'Look up the main admin account', // optional
      expectedOutput: { id: 'usr_admin_001', role: 'admin' }, // optional: shown for reference only
    },
  ],
},
```

Add examples only where they help. Every tool still gets docs and a Try it form without them.

#### Tags

Labels for your tools. Each tag shows as a badge on the tool's page, and the sidebar search matches tags too. A tool can have more than one tag.

```typescript
tags: {
  'User management': ['get_user', 'create_user'],
  'Admin':           ['purge_cache'],
},
```

### Full example

```typescript
import { defineConfig } from 'mcp-playbook'

export default defineConfig({
  title:       'Acme Corp API Playbook',      // optional
  description: 'Docs for our internal tools', // optional

  servers: [
    // A local server that MCP Playbook starts for you
    {
      name:      'Local API',
      transport: 'stdio',
      command:   'node',
      args:      ['./dist/server.js'],
      cwd:       './packages/api',              // optional
      env: {                                    // optional
        API_KEY: process.env.API_KEY!,
      },
    },

    // A server that's already running
    {
      name:      'Remote API',
      transport: 'http',
      url:       'https://api.example.com/mcp',
      headers: {                                // optional
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
    },
  ],

  examples: {                                   // optional
    get_user: [{ label: 'Admin user', input: { userId: 'usr_admin_001' } }],
  },

  tags: {                                       // optional
    'User management': ['get_user', 'create_user'],
  },
})
```

---

## Server recipes

Copy the one that matches your server and change the paths.

```typescript
// Node.js (JavaScript)
{ name: 'My Server', transport: 'stdio', command: 'node', args: ['./dist/server.js'] }

// TypeScript, run directly with tsx (npm i -D tsx)
{ name: 'My Server', transport: 'stdio', command: 'npx', args: ['tsx', './src/server.ts'] }

// TypeScript on Node 22.18+ / 23.6+ (Node can run .ts files natively)
{ name: 'My Server', transport: 'stdio', command: 'node', args: ['./src/server.ts'] }

// Python
{ name: 'My Server', transport: 'stdio', command: 'python', args: ['server.py'] }

// Python inside a virtualenv: point at the venv's python
{ name: 'My Server', transport: 'stdio', command: './.venv/bin/python', args: ['server.py'] }

// Python with uv
{ name: 'My Server', transport: 'stdio', command: 'uv', args: ['run', 'server.py'] }

// Compiled binary (Go, Rust, …)
{ name: 'My Server', transport: 'stdio', command: './bin/my-server' }

// A published MCP server from npm
{ name: 'Filesystem', transport: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem', './'] }

// Running HTTP server
{ name: 'My Server', transport: 'http', url: 'http://localhost:3001/mcp' }

// Running HTTP server with a token
{ name: 'My Server', transport: 'http', url: 'https://api.example.com/mcp',
  headers: { Authorization: `Bearer ${process.env.API_TOKEN}` } }

// Running SSE server (older transport)
{ name: 'My Server', transport: 'sse', url: 'http://localhost:3002/sse' }
```

**Several servers?** List them all in `servers`. They show up together in one UI, and you can filter by server.

> MCP Playbook needs **one entry per server: its entry file or URL**. How your server is organised inside doesn't matter. It reads the tool list over the MCP protocol (`tools/list`), so you never list tools in the config.

---

## Commands

### `mcp-playbook dev`

Starts the local UI with live reload and opens your browser.

| Option | What it does | Default |
|---|---|---|
| `-p, --port <port>` | Port to run on | `port` from config, else `4242` |
| `-c, --config <path>` | Config file to use | `playbook.config.ts` |
| `--no-open` | Don't open the browser | opens it |

```bash
npx mcp-playbook dev --port 8080
npx mcp-playbook dev --config ./docs/playbook.config.ts
```

### `mcp-playbook build`

Connects to your servers once, then writes a **static website** you can host anywhere.

| Option | What it does | Default |
|---|---|---|
| `-o, --output <dir>` | Output folder | `playbook-dist` |
| `-c, --config <path>` | Config file to use | `playbook.config.ts` |

### `mcp-playbook init`

Creates a starter `playbook.config.ts`. It won't overwrite an existing one.

---

## Using the UI

- **Sidebar**: every tool from every server. Search by name, description or tag, and filter by server. A green dot means connected, red means it couldn't connect.
- **Docs tab**: each parameter with its type, required/optional, default, description and allowed values.
- **Try it tab**: a form built from the tool's schema. Text, numbers, true/false and dropdowns (for enums) get normal inputs. Objects and arrays take JSON. Click **Run tool** to call your real server and see the response and how long it took.
- **Examples tab**: your saved examples. **Load →** fills in the Try it form.
- **Schema tab**: the raw JSON Schema and tool definition, ready to copy.

---

## Deploying the docs

`mcp-playbook build` produces plain HTML/JS files. You can host them on GitHub Pages, Vercel, Netlify, S3, nginx, or anywhere else, including sub-paths like `/docs/`.

Good to know:

- The deployed site shows **Docs, Examples and Schema**. **Run tool is disabled**, because there's no live server behind a static site.
- Your servers must be **reachable while `build` runs**: stdio servers get started, and http/sse servers must already be running. Any `env` / `headers` secrets must be set at that point.
- **Secrets are never written to the output.** Values from `env` and `headers` don't appear in the built files.

### GitHub Pages

```yaml
# .github/workflows/deploy-playbook.yml
name: Deploy MCP Playbook
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build                      # build your MCP server, if it needs it
      - run: npx mcp-playbook build --output ./docs
        env:
          API_KEY: ${{ secrets.API_KEY }}       # only if your config reads it
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
```

### Vercel / Netlify / your own server

```bash
npx mcp-playbook build                         # writes ./playbook-dist
vercel deploy playbook-dist --prod             # Vercel
netlify deploy --dir playbook-dist --prod      # Netlify
cp -r playbook-dist/* /var/www/mcp-docs/       # nginx / any web server
```

---

## Troubleshooting

**`Cannot find package 'mcp-playbook'`**
The package isn't installed in this project. Run `npm install -D mcp-playbook` in the folder that has your `playbook.config.ts`.

**`Config not found: playbook.config.ts`**
Run `npx mcp-playbook init`, or point at your file with `--config path/to/config.ts`.

**`Cannot load config` / `Invalid config`**
The message includes the real cause (a syntax error, a typo…). The config must `export default` an object with a `servers` array.

**A server shows a red dot (couldn't connect)**
1. **stdio:** run the exact `command` + `args` yourself in a terminal. It should start without errors and wait for input. Check that paths are right relative to `cwd`.
2. **stdio, works in a terminal but not here:** your server probably needs an environment variable. Add it to `env` (see [`env`](#env-secrets-and-settings-for-your-server-optional)).
3. **http / sse:** make sure the server is running and the `url` includes the path (`/mcp` or `/sse`). Check `headers` if it needs auth.
4. The terminal running `mcp-playbook dev` shows the full error.

**Tool returns 401 / Unauthorized**
Your server needs credentials. Pass them through `env` (stdio) or `headers` (http/sse).

**Port 4242 is busy**
`mcp-playbook dev` automatically moves to the next free port and prints the URL. The usual cause is an old `mcp-playbook dev` still running. Find it with `lsof -i :4242` and stop it with `kill <PID>`, or pick another port with `--port 5000`.

**Config changes don't show up**
Save the file again or click **↻ Refresh** in the top bar. Restarting `dev` always works.

---

## How it compares

| | MCP Inspector | MCP Playbook |
|---|---|---|
| **Made for** | Debugging the protocol while you build | Documenting and sharing tools with your team |
| **Shareable URL / static site** | ❌ localhost only | ✅ `mcp-playbook build` |
| **Examples saved in git** | ❌ | ✅ |
| **Many servers in one view** | ❌ one at a time | ✅ |
| **Raw JSON-RPC messages, OAuth debugging** | ✅ | ❌ not the goal |

They work well together: **Inspector** for debugging while you build, **MCP Playbook** for docs your team (or customers) can browse.

MCP Playbook works with servers in **any language**: Node.js, Python, Go, Rust and more. It only uses the standard MCP protocol, over any transport.

---

## Roadmap

| Feature | Status |
|---|---|
| Auto-generated docs, Try it, Examples, Schema tabs | ✅ Done |
| stdio / HTTP / SSE transports | ✅ Done |
| Live reload on config change | ✅ Done |
| Static site build | ✅ Done |
| Multi-server dashboard | ✅ Done |
| Resources and prompts (not just tools) | 🗓 Planned |
| Theming via `theme` | 🗓 Planned |
| Tool call history | 🗓 Planned |
| Export calls as curl / fetch / SDK snippets | 🗓 Planned |
| Schema diff when tools change | 🗓 Planned |
| OAuth 2.0 login in the UI | 🗓 Planned |
| Embeddable `<MCPPlaybook />` React component | 🗓 Planned |
| Mock mode (no real server needed) | 🔭 Exploring |

---

## Contributing

Contributions are very welcome: bug reports, docs, fixes and features. **[Read the contributing guide →](CONTRIBUTING.md)** for setup, project structure, and how to open a PR.

```bash
git clone https://github.com/rahulnag/mcp-playbook && cd mcp-playbook
npm install && npm run build
npx mcp-playbook dev --config example/playbook.config.ts   # runs your local build against the example server
```

---

## License

MIT © [Rahul Nag](https://www.rahulnag.in)

<div align="center">

[npm](https://www.npmjs.com/package/mcp-playbook) · [GitHub](https://github.com/rahulnag/mcp-playbook) · [Issues](https://github.com/rahulnag/mcp-playbook/issues)

*If MCP Playbook saves you time, give it a ⭐ on GitHub*

</div>
