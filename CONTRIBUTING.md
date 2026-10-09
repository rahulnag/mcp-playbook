# Contributing to MCP Playbook

Thanks for helping out! Every kind of contribution is welcome: bug reports, docs fixes, small improvements, and new features.

**Quick links:** [Setup](#1-set-up-the-project) · [Project structure](#2-project-structure) · [Development workflow](#3-development-workflow) · [Testing](#4-test-your-change) · [Opening a PR](#5-open-a-pull-request) · [Reporting bugs](#reporting-bugs)

---

## Ways to contribute

- **Report a bug.** [Open an issue](https://github.com/rahulnag/mcp-playbook/issues/new/choose) using the bug template.
- **Fix a typo or improve the docs.** Just open a PR, no issue needed.
- **Fix a bug.** Comment on the issue so others know you're on it, then open a PR.
- **Add a feature.** Please [open a feature request](https://github.com/rahulnag/mcp-playbook/issues/new/choose) **first**, so we can agree on the approach before you spend time on it. The [Roadmap](README.md#roadmap) lists ideas we'd love help with.

New here? Look for issues labelled **`good first issue`**.

---

## 1. Set up the project

You need **Node.js 18+** (20 or newer recommended) and **git**.

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/<your-username>/mcp-playbook.git
cd mcp-playbook

# 2. Install dependencies
npm install

# 3. Build everything (CLI/server with tsup + UI with Vite → dist/)
npm run build

# 4. Run it against the bundled example server
npx mcp-playbook dev --config example/playbook.config.ts
```

Your browser opens at http://localhost:4242 showing **3 tools** from the example server. If you see that, you're ready.

> Inside this repo, `npx mcp-playbook` runs **your local build** from `dist/`, not the version published on npm. Re-run `npm run build` (or use watch mode below) after changing code.

---

## 2. Project structure

```
mcp-playbook/
├── bin/
│   ├── mcp-playbook.js        CLI entry point (what `npx mcp-playbook` runs)
│   └── postinstall.js         prints a "get started" message after install
├── src/
│   ├── cli/index.ts           the `init`, `dev` and `build` commands
│   ├── config.ts              config types + defineConfig()
│   ├── index.ts               public API (what users import)
│   ├── server/
│   │   ├── load-config.ts     loads playbook.config.ts (via jiti)
│   │   ├── connector.ts       connects to MCP servers, lists tools, runs tools
│   │   ├── dev-server.ts      Express API + WebSocket live reload for `dev`
│   │   └── build.ts           static site generator for `build`
│   └── client/                the React UI
│       ├── App.tsx            the whole UI
│       ├── main.tsx           React entry
│       └── hooks/             data fetching, tool execution, live reload
├── example/
│   ├── playbook.config.ts     example config used for local testing
│   └── mock-server.mjs        a small MCP server with 3 tools
├── scripts/smoke-test.js      end-to-end check used by `npm test` and CI
├── index.html                 Vite entry for the UI
├── tsup.config.ts             builds src/cli + src/server → dist/
└── vite.client.config.ts      builds src/client → dist/client/
```

`dist/` is generated. Never edit it, and never commit it (it's in `.gitignore`).

### How a request flows

```
npx mcp-playbook dev
  → bin/mcp-playbook.js → dist/cli/index.js         (src/cli/index.ts)
  → load playbook.config.ts                         (src/server/load-config.ts)
  → connect to each server, call tools/list         (src/server/connector.ts)
  → start Express on :4242, serve the UI + API      (src/server/dev-server.ts)
        GET  /api/servers   → tool list for the UI
        POST /api/execute   → runs a tool (the "Run tool" button)
        WebSocket           → tells the browser to reload when the config changes
  → React UI renders it                             (src/client/)
```

If something breaks, this tells you which file to look in.

---

## 3. Development workflow

### Changing the CLI or server (`src/cli`, `src/server`, `src/config.ts`)

```bash
npm run dev                                                   # terminal 1: rebuilds on save
npx mcp-playbook dev --config example/playbook.config.ts      # terminal 2: restart after each rebuild
```

### Changing the UI (`src/client`)

```bash
npx mcp-playbook dev --config example/playbook.config.ts --no-open   # terminal 1: API on :4242
npm run dev:client                                                   # terminal 2: UI with hot reload
```

Open **http://localhost:5173** (not 4242). Vite reloads the UI instantly on save and forwards API calls to port 4242.

### Testing with your own MCP server

Point the CLI at any config:

```bash
npx mcp-playbook dev --config /path/to/your-project/playbook.config.ts
```

Or use `npm link` to use your local build inside another project:

```bash
npm link                       # in this repo, once
cd /path/to/your-project
npm link mcp-playbook          # your project now uses your local build
npx mcp-playbook dev
```

Run `npm unlink mcp-playbook` in your project when you're done.

---

## 4. Test your change

Run these before opening a PR. CI runs the same checks on Linux (Node 18, 20, 22) and Windows.

```bash
npm run typecheck   # TypeScript, no errors allowed
npm run build       # must succeed
npm test            # smoke test: builds the example site and checks the tools were discovered
```

Then check your change by hand:

- [ ] `npx mcp-playbook dev --config example/playbook.config.ts` starts and the UI loads
- [ ] Editing `example/playbook.config.ts` (e.g. the `title`) updates the open page
- [ ] **Run tool** on a tool returns a result
- [ ] If you touched config loading or packaging: test like a real user (below)

### Test like a real user (`npm pack`)

This catches packaging bugs, such as files missing from the published package:

```bash
npm run build && npm pack                     # creates mcp-playbook-<version>.tgz

mkdir /tmp/pb-test && cd /tmp/pb-test
npm init -y
npm install /path/to/mcp-playbook/mcp-playbook-<version>.tgz
npx mcp-playbook init
cp /path/to/mcp-playbook/example/mock-server.mjs .
# edit playbook.config.ts → args: ['./mock-server.mjs']
npx mcp-playbook dev
npx mcp-playbook build                        # should create playbook-dist/
```

> There's no unit test suite yet. **Adding tests is a very welcome contribution!**

---

## 5. Open a pull request

1. Create a branch: `git checkout -b fix/port-crash` or `feat/resources-tab`
2. Keep the PR **focused**: one fix or feature per PR.
3. **Update `README.md`** if you change anything users see or configure.
4. Push to your fork and open a PR against `main`. Fill in the template.
5. Don't bump the version in `package.json`. The maintainer does that when releasing.

Commit messages: short and descriptive, e.g. `fix: crash when port is in use`. Prefixes like `fix:`, `feat:` and `docs:` are appreciated but not required.

---

## Reporting bugs

Use the [bug report template](https://github.com/rahulnag/mcp-playbook/issues/new/choose) and include:

- `npx mcp-playbook --version`, `node --version`, and your OS
- Your `playbook.config.ts` (**remove secrets**)
- The full error from the terminal
- What your MCP server is written in and which transport it uses

For security issues, please **don't open a public issue**. Contact the maintainer privately via [rahulnag.in](https://www.rahulnag.in) instead.

---

## Common problems

| Problem | Fix |
|---|---|
| `dist/ not found` when running the CLI | `npm run build` |
| UI shows the "React UI bundle was not found" placeholder | `npm run build:client` |
| Code changes don't show up | Rebuild (`npm run build`, or keep `npm run dev` running) and restart `mcp-playbook dev` |
| `npm link` doesn't pick up changes | `npm run build` in this repo; server changes need a restart of `dev` |
| Port 4242 busy | `dev` moves to the next free port automatically, or use `--port` |

---

Maintainers: see [RELEASING.md](RELEASING.md) for publishing to npm.
