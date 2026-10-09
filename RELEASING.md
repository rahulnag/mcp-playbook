# Releasing MCP Playbook

**For maintainers** with publish rights on npm. Contributors don't need this. See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## One-time setup

```bash
npm login
npm whoami          # should print your npm username
```

Turn on [two-factor auth](https://docs.npmjs.com/configuring-two-factor-authentication) for your npm account. `npm publish` will then ask for a one-time code.

---

## Releasing a new version

### 1. Make sure `main` is green

- CI passes on GitHub (the **Actions** tab)
- Your working tree is clean: `git status` shows nothing to commit
- You're up to date: `git pull origin main`

### 2. Check the package contents

```bash
npm pack --dry-run
```

The list should contain `dist/` (including `dist/client/index.html`), `bin/`, `README.md`, `LICENSE` and `package.json`, and **nothing else**: no `src/`, `.env`, or `node_modules/`.

For bigger releases, also do the [real-user test](CONTRIBUTING.md#test-like-a-real-user-npm-pack) with the `.tgz`.

### 3. Bump the version

`npm version` updates `package.json`, commits, and creates a git tag in one step:

```bash
npm version patch   # bug fixes, docs                 0.1.9 → 0.1.10
npm version minor   # new features                    0.1.9 → 0.2.0
npm version major   # breaking changes                0.1.9 → 1.0.0
```

> **While we're below 1.0**, breaking changes (e.g. renaming a config field) bump the **minor** version (`0.1.x → 0.2.0`), and everything else is a patch.

### 4. Publish

```bash
npm publish
```

`prepublishOnly` automatically runs `typecheck`, a clean `build`, and the smoke test first. If any of them fails, nothing is published.

### 5. Push the commit and tag

```bash
git push origin main --follow-tags
```

### 6. Create a GitHub release

On GitHub: **Releases → Draft a new release**, pick the new tag (e.g. `v0.1.10`), and click **Generate release notes**. Edit the notes into a short list of what changed for users.

### 7. Verify

```bash
npm view mcp-playbook version      # shows the new version
```

---

## If a release is broken

**Preferred: deprecate it and publish a fix.**

```bash
npm deprecate mcp-playbook@0.1.10 "Broken config loading, please upgrade to 0.1.11"
# fix the bug, then release again (steps 1–7)
```

Users installing the bad version see the warning.

**Emergency only: unpublish.** Only within 72 hours of publishing, and only for things like accidentally published secrets. A version number can never be reused afterwards.

```bash
npm unpublish mcp-playbook@0.1.10
```

---

## Live demo on GitHub Pages (optional)

You can host the docs generated from `example/` as a live demo, e.g. `https://rahulnag.github.io/mcp-playbook/`, and link it from the README.

**1.** In the repo, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.

**2.** Add `.github/workflows/pages.yml`:

```yaml
name: Deploy demo docs

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - run: npx mcp-playbook build --config example/playbook.config.ts --output playbook-dist
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: playbook-dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

**3.** Push to `main`. The URL appears in the workflow run and under **Settings → Pages**.

Notes:
- Nothing gets committed back to the repo. The site is rebuilt from scratch on every push.
- The demo shows Docs, Examples and Schema. **Run tool** is disabled on static sites.
- It works under the `/mcp-playbook/` sub-path because the UI uses relative asset URLs.

---

## Common publish errors

| Error | Fix |
|---|---|
| `403 Forbidden — you must be logged in` | `npm login` |
| `403 — cannot publish over previously published version` | You forgot to bump: `npm version patch` |
| `npm version` fails with "working directory not clean" | Commit or stash your changes first |
| `prepublishOnly` fails | Fix the failing step (typecheck, build or smoke test). Nothing was published |
| `EOTP` / one-time password required | Enter the code from your authenticator app |
