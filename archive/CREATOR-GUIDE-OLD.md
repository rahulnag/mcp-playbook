# MCP Playbook — Creator Guide

> This guide is for **you, the library creator**. It covers everything from
> first-time local setup to publishing to npm and handling future updates.
> Keep this file private or in a separate internal repo — it is not for end users.

---

## Table of contents

1. [Prerequisites](#1-prerequisites)
2. [First time local setup](#2-first-time-local-setup)
3. [Project structure explained](#3-project-structure-explained)
4. [Daily development workflow](#4-daily-development-workflow)
5. [Testing the library locally](#5-testing-the-library-locally)
6. [Pre-publish verification checklist](#6-pre-publish-verification-checklist)
7. [Publishing to npm for the first time](#7-publishing-to-npm-for-the-first-time)
8. [Future updates and republishing](#8-future-updates-and-republishing)
9. [Versioning rules](#9-versioning-rules)
10. [Rollback if something goes wrong](#10-rollback-if-something-goes-wrong)
11. [Common errors and fixes](#11-common-errors-and-fixes)

---

## 1. Prerequisites

Before anything, make sure you have these installed on your machine:

```bash
# Check Node.js — must be 18 or higher
node --version
# Expected: v18.x.x or higher

# Check npm
npm --version
# Expected: 9.x.x or higher

# Check git
git --version
```

You also need an npm account. If you do not have one:

```bash
# Create account at https://www.npmjs.com/signup
# Then login in terminal
npm login
# Enter your username, password, email
# Check: npm whoami  → should print your username
```

---

## 2. First time local setup

Run this exactly once after cloning the repo.

```bash
# Clone your repo
git clone https://github.com/your-org/mcp-playbook
cd mcp-playbook

# Install all dependencies
# (installs both runtime deps and devDependencies like tsup, vite, typescript)
npm install

# Build the library — compiles TypeScript and React UI
# This creates the dist/ folder
npm run build

# Verify dist/ was created correctly
ls dist/
# Must show: index.js  index.mjs  index.d.ts  cli/  server/  client/

ls dist/client/
# Must show: index.html  assets/

# Verify the binary works
node bin/mcp-playbook.js --version
# Must show: 0.1.0 (or whatever version is in package.json)
```

If all three verifications pass, your local setup is complete.

---

## 3. Project structure explained

```
mcp-playbook/
│
├── bin/
│   ├── mcp-playbook.js      ← CLI binary entry point (what npm executes)
│   └── postinstall.js        ← prints helpful message after npm install
│
├── src/
│   ├── cli/
│   │   └── index.ts          ← defines dev, build, init commands
│   ├── client/
│   │   ├── App.tsx           ← the entire React UI
│   │   ├── main.tsx          ← React entry point
│   │   └── hooks/
│   │       ├── useServers.ts     ← fetches tools from /api/servers
│   │       ├── useExecute.ts     ← calls /api/execute to run tools
│   │       └── useHotReload.ts   ← WebSocket for hot reload
│   ├── server/
│   │   ├── connector.ts      ← connects to MCP servers, discovers tools
│   │   ├── dev-server.ts     ← Express + WebSocket API server
│   │   └── build.ts          ← static site generator
│   ├── config.ts             ← defineConfig() + all TypeScript types
│   └── index.ts              ← public API (what users import)
│
├── example/
│   ├── playbook.config.ts   ← example config for testing
│   └── mock-server.mjs       ← mock MCP server with 2 tools for testing
│
├── dist/                     ← GENERATED — never edit, never commit
│   ├── index.js              ← compiled library (CJS)
│   ├── index.mjs             ← compiled library (ESM)
│   ├── index.d.ts            ← TypeScript types
│   ├── cli/                  ← compiled CLI
│   ├── server/               ← compiled server code
│   └── client/               ← compiled React UI (built by Vite)
│       ├── index.html
│       └── assets/
│
├── index.html                ← Vite HTML entry point for client build
├── package.json              ← library config, bin, files, scripts
├── tsconfig.json             ← TypeScript config
├── tsup.config.ts            ← bundles server/CLI to dist/
├── vite.client.config.ts     ← bundles React UI to dist/client/
├── .gitignore                ← excludes node_modules, dist, .env
└── .npmignore                ← excludes src, example from npm package
```

**The two build steps:**

```
npm run build:server  →  tsup compiles src/cli/ + src/server/ → dist/
npm run build:client  →  Vite compiles src/client/ → dist/client/
npm run build         →  runs both in sequence
```

---

## 4. Daily development workflow

When you are actively working on the library, use watch mode so you do not have to rebuild manually after every change.

**Open three terminals:**

```bash
# Terminal 1 — watches src/cli/ and src/server/ — rebuilds on save
npm run dev

# Terminal 2 — watches src/client/ — Vite HMR, browser updates instantly
npm run dev:client

# Terminal 3 — runs the actual Playbook against the example server
npx mcp-playbook dev --config example/playbook.config.ts
```

**How changes work:**

```
You change src/server/connector.ts
→ Terminal 1 rebuilds automatically (tsup watch)
→ Restart Terminal 3 to pick up the change

You change src/client/App.tsx
→ Terminal 2 rebuilds automatically (Vite HMR)
→ Browser updates automatically — no restart needed

You change src/cli/index.ts
→ Terminal 1 rebuilds automatically
→ Restart Terminal 3 to pick up the change
```

**Quick one-off rebuild:**

```bash
# When you just want to build and test without watch mode
npm run build && npx mcp-playbook dev --config example/playbook.config.ts
```

---

## 5. Testing the library locally

There are three levels of testing. Always do all three before publishing.

---

### Level 1 — Quick smoke test (fastest, from source)

Tests that the library works at a basic level using the included example.

```bash
# Build
npm run build

# Run against example config
npx mcp-playbook dev --config example/playbook.config.ts
```

**What to verify:**

```
Terminal output:
  ✓ "⚡ MCP Playbook" header appears
  ✓ "1/1 servers · 2 tools" (or similar) appears
  ✓ "Local: http://localhost:4242" appears
  ✓ No error messages

Browser at http://localhost:4242:
  ✓ UI loads without blank screen
  ✓ Sidebar shows "greet_user" and "calculate" tools
  ✓ Clicking a tool opens the detail panel
  ✓ Docs tab shows parameters with type badges
  ✓ Try it tab shows input form
  ✓ Click Run — response appears (test with greet_user, name: "World")
  ✓ Examples tab shows preset examples
  ✓ Schema tab shows raw JSON
```

---

### Level 2 — User simulation test with npm pack (most important)

This simulates exactly what a real user experiences when they install your package from npm. It catches problems that Level 1 never catches — wrong paths in compiled output, missing files in package, broken require() calls.

```bash
# Step 1 — clean build
rm -rf dist/
npm run build

# Step 2 — pack the library into a tarball
npm pack
# Creates: mcp-playbook-0.1.0.tgz in your current folder

# Step 3 — inspect what is inside the tarball
tar -tzf mcp-playbook-0.1.0.tgz
```

**The tarball must contain exactly these and nothing more:**

```
✓ package/dist/index.js
✓ package/dist/index.mjs
✓ package/dist/index.d.ts
✓ package/dist/cli/index.js
✓ package/dist/server/dev-server.js
✓ package/dist/server/connector.js
✓ package/dist/server/build.js
✓ package/dist/client/index.html
✓ package/dist/client/assets/ (JS + CSS files)
✓ package/bin/mcp-playbook.js
✓ package/bin/postinstall.js
✓ package/README.md
✓ package/package.json

✗ package/src/        ← must NOT be here
✗ package/node_modules/ ← must NOT be here
✗ package/.env        ← must NOT be here
✗ package/example/    ← must NOT be here
```

```bash
# Step 4 — create a fresh test project (completely separate from your library)
mkdir /tmp/mcp-playbook-test
cd /tmp/mcp-playbook-test
npm init -y

# Step 5 — install from the tarball (simulates npm install)
npm install --save-dev /path/to/mcp-playbook/mcp-playbook-0.1.0.tgz
```

**After install, verify postinstall message appeared:**

```
✓ Should print:
  ⚡ mcp-playbook installed successfully

  Get started:
    npx mcp-playbook init   — create playbook.config.ts
    npx mcp-playbook dev    — start the dev server
    npx mcp-playbook build  — build static docs site
```

```bash
# Step 6 — test init command
npx mcp-playbook init
```

**Verify:**

```
✓ playbook.config.ts created in /tmp/mcp-playbook-test/
✓ File contains the template with servers, examples, tags, theme
✓ Running init again shows "already exists" message
```

```bash
# Step 7 — copy the mock server from your library for testing
cp /path/to/mcp-playbook/example/mock-server.mjs .

# Edit playbook.config.ts to point at mock server
# Change args: ['./my-mcp-server.js'] to args: ['./mock-server.mjs']

# Step 8 — test dev command
npx mcp-playbook dev
```

**Verify:**

```
✓ Server starts, shows port 4242
✓ Browser opens with UI
✓ Tools from mock server appear in sidebar
✓ Try it works — run greet_user and see response
```

```bash
# Step 9 — test build command
npx mcp-playbook build

ls playbook-dist/
# Must show: index.html  assets/  data.json
```

**All nine steps passing = safe to publish.**

---

### Level 3 — npm link test (for ongoing development)

Use this when you are making many changes and want fast feedback without repacking each time.

```bash
# In your library folder
cd mcp-playbook
npm run build
npm link
# Registers mcp-playbook globally as a symlink to your folder

# In your test project (or any project with an MCP server)
cd your-other-project
npm link mcp-playbook
# node_modules/mcp-playbook now points to your library source

# Test
npx mcp-playbook init
npx mcp-playbook dev

# After making changes
cd mcp-playbook
npm run build         # changes available immediately — no relinking needed

# Clean up when done
cd your-other-project
npm unlink mcp-playbook

cd mcp-playbook
npm unlink
```

---

## 6. Pre-publish verification checklist

Run through every item before every publish. Do not skip any.

```
BUILD
  □ rm -rf dist/ && npm run build  (clean build from scratch)
  □ dist/ exists with correct structure
  □ dist/client/index.html exists
  □ dist/client/assets/ contains JS and CSS files
  □ dist/cli/index.js exists
  □ dist/server/ exists

BINARY
  □ node bin/mcp-playbook.js --version  (prints correct version)
  □ node bin/mcp-playbook.js --help     (prints commands)
  □ npx mcp-playbook init               (creates config file)
  □ npx mcp-playbook dev                (starts server, UI loads)

PACKAGE CONTENTS
  □ npm pack --dry-run  (check file list)
  □ src/ NOT in the list
  □ node_modules/ NOT in the list
  □ .env NOT in the list
  □ dist/ IS in the list
  □ bin/ IS in the list

VERSION
  □ package.json version bumped correctly
  □ version follows semver (see section 9)

GIT
  □ All changes committed
  □ git status shows clean working tree
  □ git log shows meaningful commit messages

USER SIMULATION
  □ npm pack + install in fresh folder passes all Level 2 checks
  □ init creates file ✓
  □ dev starts and UI loads ✓
  □ Try it executes tool and returns result ✓
  □ build generates playbook-dist/ ✓
```

---

## 7. Publishing to npm for the first time

Only do this after all Level 1, 2, 3 tests pass and the full checklist is complete.

```bash
# Step 1 — make sure you are logged in
npm whoami
# Must print your npm username
# If not logged in: npm login

# Step 2 — clean build
rm -rf dist/
npm run build

# Step 3 — verify version in package.json
cat package.json | grep '"version"'
# Must be 0.1.0 for first publish

# Step 4 — dry run — see exactly what will be uploaded
npm publish --dry-run --access public
# Read the output carefully
# Verify file list looks correct

# Step 5 — publish for real
npm publish --access public
# --access public is required for scoped packages (@your-org/mcp-playbook)
# For unscoped packages (mcp-playbook) it defaults to public

# Step 6 — verify it is on npm
npm view mcp-playbook
# Should show your package info

# Step 7 — test install from npm (the real thing)
mkdir /tmp/final-test && cd /tmp/final-test
npm init -y
npm install --save-dev mcp-playbook
npx mcp-playbook --version
# Should print 0.1.0
```

**After first publish, tag the release in git:**

```bash
cd mcp-playbook
git tag v0.1.0
git push origin v0.1.0
```

---

## 8. Future updates and republishing

Every time you make changes and want to publish a new version, follow this exact sequence. No exceptions.

### Step 1 — Make and commit your changes

```bash
# Make your code changes
# Test locally (Level 1, 2, 3)
# Then commit

git add .
git commit -m "feat: add OAuth support in Try it tab"
# or
git commit -m "fix: correct clientDist path on Windows"
# or
git commit -m "docs: update configuration examples"
```

### Step 2 — Bump the version

```bash
# Patch release (bug fix: 0.1.0 → 0.1.1)
npm version patch

# Minor release (new feature, backward compatible: 0.1.0 → 0.2.0)
npm version minor

# Major release (breaking change: 0.1.0 → 1.0.0)
npm version major
```

`npm version` does three things automatically:
- Updates `version` in `package.json`
- Creates a git commit with the version bump
- Creates a git tag (v0.1.1, v0.2.0, etc.)

### Step 3 — Build

```bash
rm -rf dist/
npm run build
```

### Step 4 — Run full test suite

```bash
# Level 1 quick test
npx mcp-playbook dev --config example/playbook.config.ts
# verify UI loads and tools work

# Level 2 user simulation
npm pack
mkdir /tmp/test-v0.1.1 && cd /tmp/test-v0.1.1
npm init -y
npm install /path/to/mcp-playbook-0.1.1.tgz
npx mcp-playbook init
npx mcp-playbook dev
# verify everything works
```

### Step 5 — Publish

```bash
# Dry run first
npm publish --dry-run --access public

# Publish for real
npm publish --access public
```

### Step 6 — Push to git

```bash
git push origin main --tags
# --tags pushes the version tag created by npm version
```

### Step 7 — Create GitHub release (recommended)

```bash
# Go to github.com/your-org/mcp-playbook/releases
# Click "Create a new release"
# Choose tag: v0.1.1
# Write release notes describing what changed
# Publish release
```

---

## 9. Versioning rules

Follow **semantic versioning** (semver) strictly. This is what npm expects and what users depend on.

```
Version format: MAJOR.MINOR.PATCH
Example:        1.2.3
```

### When to bump PATCH (0.1.0 → 0.1.1)

Bug fixes only. Nothing new, nothing broken.

```
✓ Fix a path resolution bug
✓ Fix a broken CLI flag
✓ Fix UI not loading on Windows
✓ Fix hot reload not triggering
✓ Fix TypeScript types that were wrong
```

```bash
npm version patch
```

### When to bump MINOR (0.1.0 → 0.2.0)

New features added. Existing features still work exactly the same.

```
✓ Add OAuth support in the UI
✓ Add a new CLI flag
✓ Add dark/light mode toggle
✓ Add tool call history tab
✓ Add new transport type support
✓ Add export as curl snippet feature
```

```bash
npm version minor
```

### When to bump MAJOR (0.1.0 → 1.0.0)

Breaking changes. Existing user configs will need to be updated.

```
✓ Rename playbook.config.ts to mcp.config.ts
✓ Remove or rename a CLI command
✓ Change the defineConfig() API in a non-backward-compatible way
✓ Change the servers array structure
✓ Drop Node.js 18 support
```

```bash
npm version major
```

### Pre-release versions

For testing a new major version before committing to it:

```bash
# Alpha — very early, may be broken
npm version 1.0.0-alpha.1

# Beta — feature complete, testing for bugs
npm version 1.0.0-beta.1

# Release candidate — almost ready
npm version 1.0.0-rc.1

# Publish as pre-release (does not become the default install)
npm publish --tag beta --access public

# Users who want the beta:
# npm install mcp-playbook@beta
# Regular users: npm install mcp-playbook  (still gets 0.x stable)
```

---

## 10. Rollback if something goes wrong

If you publish a broken version and users are reporting issues:

### Option 1 — Deprecate the bad version and publish a fix (preferred)

```bash
# Mark the bad version as deprecated
# Users who already installed it see a warning
npm deprecate mcp-playbook@0.1.1 "This version has a critical bug. Please upgrade to 0.1.2"

# Fix the bug in your code
# Bump to 0.1.2
npm version patch
npm run build
npm publish --access public
```

### Option 2 — Unpublish within 72 hours (emergency only)

npm allows unpublishing within 72 hours of publish. After 72 hours you cannot unpublish.

```bash
# Unpublish a specific version
npm unpublish mcp-playbook@0.1.1

# This makes that version permanently unavailable
# Anyone who had it cached can still use it
# But new installs cannot get it
```

> ⚠️ Only use unpublish in genuine emergencies (accidentally published secrets, severe security vulnerability). For bugs, always prefer deprecate + fix.

### Option 3 — Tell users to pin the previous version

```bash
# Tell users in GitHub issues / README:
npm install mcp-playbook@0.1.0
# until 0.1.2 is out
```

---

## 11. Common errors and fixes

### Build errors

```
Error: Cannot find module 'tsup'
Fix:   npm install  (dependencies not installed)

Error: Cannot find module 'vite'
Fix:   npm install  (same)

Error: Type error in src/...
Fix:   Fix the TypeScript error, then npm run build
       Run npm run typecheck to see all errors at once
```

### Binary errors

```
Error: dist/cli/index.js not found
Fix:   npm run build  (dist/ not built yet)

Error: Cannot find module '../server/dev-server.js'
Fix:   npm run build:server  (server not compiled)

Error: Cannot find module '../client/index.html'  
Fix:   npm run build:client  (React UI not built)
```

### npm publish errors

```
Error: 403 Forbidden — You must be logged in
Fix:   npm login

Error: 403 Forbidden — Package name already taken
Fix:   Choose a different name in package.json
       Or use a scoped name: @your-username/mcp-playbook

Error: 402 Payment required
Fix:   npm publish --access public
       (required for scoped packages)

Error: Version already exists
Fix:   npm version patch  (bump the version first)
       You cannot publish the same version twice
```

### npm link errors

```
Error: mcp-playbook not found after npm link
Fix:
  cd mcp-playbook
  npm run build        (must build before linking)
  npm unlink           (clean up old link)
  npm link             (relink)

Error: Changes not reflected after rebuild
Fix:   Restart the dev server in the test project
       (server-side changes need a restart)
       (client-side changes update via HMR automatically)
```

### UI not loading

```
Browser shows blank screen or placeholder HTML
Fix:   dist/client/ not built
       npm run build:client
       Check: ls dist/client/index.html
```

---

## Quick reference card

```
DAILY DEVELOPMENT
  npm run dev                          watch server/CLI
  npm run dev:client                   watch React UI
  npx mcp-playbook dev \
    --config example/playbook.config.ts  run against example

BUILD
  npm run build                        build everything
  npm run build:server                 server/CLI only
  npm run build:client                 React UI only
  rm -rf dist/ && npm run build        clean build

TEST
  npx mcp-playbook --version          verify binary works
  npx mcp-playbook init               test init command
  npx mcp-playbook dev                test dev command
  npm pack                             create tarball
  npm publish --dry-run                check what will upload

LOCAL LINKING
  npm link                             register globally
  npm link mcp-playbook               use in another project
  npm unlink                           clean up

VERSIONING
  npm version patch                    bug fix (0.1.0 → 0.1.1)
  npm version minor                    new feature (0.1.0 → 0.2.0)
  npm version major                    breaking change (0.1.0 → 1.0.0)

PUBLISH
  npm publish --access public          publish to npm
  npm publish --tag beta               publish as pre-release
  npm deprecate pkg@ver "message"      deprecate a bad version

GIT
  git push origin main --tags          push code + version tag
```
